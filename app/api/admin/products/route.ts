import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "products:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";

    let data, countResult;

    if (search && category) {
      countResult = await sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM products
        WHERE (name ILIKE ${'%' + search + '%'} OR slug ILIKE ${'%' + search + '%'})
          AND (category = ${category} OR category_id::text = ${category})
      `;
      data = await sql`
        SELECT p.*, pc.name AS category_name, ps.name AS subcategory_name
        FROM products p
        LEFT JOIN product_categories pc ON pc.id = p.category_id
        LEFT JOIN product_subcategories ps ON ps.id = p.subcategory_id
        WHERE (p.name ILIKE ${'%' + search + '%'} OR p.slug ILIKE ${'%' + search + '%'})
          AND (p.category = ${category} OR p.category_id::text = ${category})
        ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (search) {
      countResult = await sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM products
        WHERE name ILIKE ${'%' + search + '%'} OR slug ILIKE ${'%' + search + '%'}
      `;
      data = await sql`
        SELECT p.*, pc.name AS category_name, ps.name AS subcategory_name
        FROM products p
        LEFT JOIN product_categories pc ON pc.id = p.category_id
        LEFT JOIN product_subcategories ps ON ps.id = p.subcategory_id
        WHERE p.name ILIKE ${'%' + search + '%'} OR p.slug ILIKE ${'%' + search + '%'}
        ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (category) {
      countResult = await sql<[{ count: string }]>`
        SELECT COUNT(*) as count FROM products
        WHERE category = ${category} OR category_id::text = ${category}
      `;
      data = await sql`
        SELECT p.*, pc.name AS category_name, ps.name AS subcategory_name
        FROM products p
        LEFT JOIN product_categories pc ON pc.id = p.category_id
        LEFT JOIN product_subcategories ps ON ps.id = p.subcategory_id
        WHERE p.category = ${category} OR p.category_id::text = ${category}
        ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM products`;
      data = await sql`
        SELECT p.*, pc.name AS category_name, ps.name AS subcategory_name
        FROM products p
        LEFT JOIN product_categories pc ON pc.id = p.category_id
        LEFT JOIN product_subcategories ps ON ps.id = p.subcategory_id
        ORDER BY p.id DESC LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const total = parseInt(countResult[0].count);
    return NextResponse.json({ data, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "products:write");
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as Record<string, unknown>;
    const { name, slug, price_cents } = body;

    if (!name || !slug || price_cents === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, price_cents" },
        { status: 400 }
      );
    }

    if ((price_cents as number) <= 0) {
      return NextResponse.json({ error: "price_cents must be greater than 0" }, { status: 400 });
    }

    const stockQty = body.stock_qty != null ? (body.stock_qty as number) : 0;
    if (stockQty < 0) {
      return NextResponse.json({ error: "stock_qty must be >= 0" }, { status: 400 });
    }

    const categoryId = body.category_id != null ? (body.category_id as number) : null;
    const subcategoryId = body.subcategory_id != null ? (body.subcategory_id as number) : null;

    // Validate subcategory belongs to the selected category
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

    const images = Array.isArray(body.images) ? (body.images as string[]) : [];
    const attributes = body.attributes && typeof body.attributes === "object" ? body.attributes : {};
    const featured = body.featured === true;
    const status = ["active", "draft", "inactive"].includes(body.status as string)
      ? (body.status as string)
      : "active";
    const inStock = body.in_stock !== undefined ? (body.in_stock ? true : false) : true;

    const [product] = await sql<[Record<string, unknown>]>`
      INSERT INTO products (
        name, slug, price_cents, category, category_id, subcategory_id,
        tagline, description, compare_at_price_cents, image, images,
        attributes, featured, status, in_stock, stock_qty
      )
      VALUES (
        ${name as string},
        ${slug as string},
        ${price_cents as number},
        ${body.category as string | null ?? null},
        ${categoryId},
        ${subcategoryId},
        ${body.tagline as string | null ?? null},
        ${body.description as string | null ?? null},
        ${body.compare_at_price_cents as number | null ?? null},
        ${body.image as string | null ?? null},
        ${sql.array(images)},
        ${JSON.stringify(attributes)},
        ${featured},
        ${status},
        ${inStock},
        ${stockQty}
      )
      RETURNING *
    `;

    await createAuditLog(
      admin.id, "create", "product",
      product.id as number,
      { name, slug },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

