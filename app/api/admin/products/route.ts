import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog, paginatedQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "products:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(name LIKE ? OR slug LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    const where = conditions.join(" AND ");
    const result = paginatedQuery("products", where, params, page, limit);

    return NextResponse.json(result);
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

    const result = db.prepare(`
      INSERT INTO products (name, slug, price_cents, category, tagline, description,
        compare_at_price_cents, image, in_stock, stock_qty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      slug,
      price_cents,
      category,
      body.tagline ?? null,
      body.description ?? null,
      body.compare_at_price_cents ?? null,
      body.image ?? null,
      body.in_stock !== undefined ? (body.in_stock ? 1 : 0) : 1,
      body.stock_qty ?? 0,
    );

    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);

    createAuditLog(
      admin.id, "create", "product",
      result.lastInsertRowid as number,
      { name, slug },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
