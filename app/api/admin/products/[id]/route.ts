import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "products:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const products = await sql`
      SELECT p.*, pc.name AS category_name, ps.name AS subcategory_name
      FROM products p
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      LEFT JOIN product_subcategories ps ON ps.id = p.subcategory_id
      WHERE p.id = ${id}
    `;
    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variants = await sql`SELECT * FROM product_variants WHERE product_id = ${id}`;

    return NextResponse.json({ ...products[0], variants });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "products:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM products WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const inStock = body.in_stock !== undefined ? (body.in_stock ? true : false) : null;

    const categoryId = body.category_id !== undefined
      ? (body.category_id as number | null)
      : null;
    const subcategoryId = body.subcategory_id !== undefined
      ? (body.subcategory_id as number | null)
      : null;

    // Validate subcategory belongs to the selected category if both provided
    if (subcategoryId && categoryId) {
      const subCheck = await sql`
        SELECT id FROM product_subcategories WHERE id = ${subcategoryId} AND category_id = ${categoryId}
      `;
      if (subCheck.length === 0) {
        return NextResponse.json(
          { error: "Subcategory does not belong to the selected category" },
          { status: 400 }
        );
      }
    }

    const images = body.images !== undefined
      ? (Array.isArray(body.images) ? (body.images as string[]) : null)
      : null;
    const attributes = body.attributes !== undefined && body.attributes !== null
      ? JSON.stringify(body.attributes)
      : null;
    const featured = body.featured !== undefined ? (body.featured ? true : false) : null;
    const status = body.status !== undefined
      ? (["active", "draft", "inactive"].includes(body.status as string) ? (body.status as string) : null)
      : null;

    await sql`
      UPDATE products SET
        name = COALESCE(${body.name as string | null ?? null}, name),
        slug = COALESCE(${body.slug as string | null ?? null}, slug),
        tagline = COALESCE(${body.tagline as string | null ?? null}, tagline),
        description = COALESCE(${body.description as string | null ?? null}, description),
        price_cents = COALESCE(${body.price_cents as number | null ?? null}, price_cents),
        compare_at_price_cents = COALESCE(${body.compare_at_price_cents as number | null ?? null}, compare_at_price_cents),
        image = COALESCE(${body.image as string | null ?? null}, image),
        images = COALESCE(${images !== null ? sql.array(images) : null}, images),
        category = COALESCE(${body.category as string | null ?? null}, category),
        category_id = COALESCE(${categoryId}, category_id),
        subcategory_id = COALESCE(${subcategoryId}, subcategory_id),
        attributes = COALESCE(${attributes}::jsonb, attributes),
        featured = COALESCE(${featured}, featured),
        status = COALESCE(${status}, status),
        in_stock = COALESCE(${inStock}, in_stock),
        stock_qty = COALESCE(${body.stock_qty as number | null ?? null}, stock_qty),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    const updated = await sql`
      SELECT p.*, pc.name AS category_name, ps.name AS subcategory_name
      FROM products p
      LEFT JOIN product_categories pc ON pc.id = p.category_id
      LEFT JOIN product_subcategories ps ON ps.id = p.subcategory_id
      WHERE p.id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "product", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(updated[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "products:delete");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM products WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "true";

    if (hard) {
      await sql`DELETE FROM products WHERE id = ${id}`;
    } else {
      await sql`UPDATE products SET in_stock = FALSE, updated_at = NOW() WHERE id = ${id}`;
    }

    await createAuditLog(
      admin.id,
      hard ? "hard_delete" : "soft_delete",
      "product", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

