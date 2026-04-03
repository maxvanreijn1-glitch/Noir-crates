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
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM products WHERE (name ILIKE ${'%' + search + '%'} OR slug ILIKE ${'%' + search + '%'}) AND category = ${category}`;
      data = await sql`SELECT * FROM products WHERE (name ILIKE ${'%' + search + '%'} OR slug ILIKE ${'%' + search + '%'}) AND category = ${category} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (search) {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM products WHERE name ILIKE ${'%' + search + '%'} OR slug ILIKE ${'%' + search + '%'}`;
      data = await sql`SELECT * FROM products WHERE name ILIKE ${'%' + search + '%'} OR slug ILIKE ${'%' + search + '%'} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (category) {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM products WHERE category = ${category}`;
      data = await sql`SELECT * FROM products WHERE category = ${category} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM products`;
      data = await sql`SELECT * FROM products ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    }

    const total = parseInt(countResult[0].count);
    return NextResponse.json({ data, total, pages: Math.ceil(total / limit) });
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
    const { name, slug, price_cents, category } = body;

    if (!name || !slug || price_cents === undefined || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, price_cents, category" },
        { status: 400 }
      );
    }

    const inStock = body.in_stock !== undefined ? (body.in_stock ? true : false) : true;
    const [product] = await sql<[Record<string, unknown>]>`
      INSERT INTO products (name, slug, price_cents, category, tagline, description,
        compare_at_price_cents, image, in_stock, stock_qty)
      VALUES (
        ${name as string}, ${slug as string}, ${price_cents as number}, ${category as string},
        ${body.tagline as string | null ?? null}, ${body.description as string | null ?? null},
        ${body.compare_at_price_cents as number | null ?? null}, ${body.image as string | null ?? null},
        ${inStock}, ${body.stock_qty as number ?? 0}
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
