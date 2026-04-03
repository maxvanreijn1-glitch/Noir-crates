import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "products:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const products = await sql`SELECT * FROM products WHERE id = ${id}`;
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

    await sql`
      UPDATE products SET
        name = COALESCE(${body.name as string | null ?? null}, name),
        slug = COALESCE(${body.slug as string | null ?? null}, slug),
        tagline = COALESCE(${body.tagline as string | null ?? null}, tagline),
        description = COALESCE(${body.description as string | null ?? null}, description),
        price_cents = COALESCE(${body.price_cents as number | null ?? null}, price_cents),
        compare_at_price_cents = COALESCE(${body.compare_at_price_cents as number | null ?? null}, compare_at_price_cents),
        image = COALESCE(${body.image as string | null ?? null}, image),
        category = COALESCE(${body.category as string | null ?? null}, category),
        in_stock = COALESCE(${inStock}, in_stock),
        stock_qty = COALESCE(${body.stock_qty as number | null ?? null}, stock_qty),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    const updated = await sql`SELECT * FROM products WHERE id = ${id}`;

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
