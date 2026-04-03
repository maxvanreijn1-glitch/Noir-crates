import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "products:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variants = db.prepare("SELECT * FROM product_variants WHERE product_id = ?").all(id);

    return NextResponse.json({ ...product as object, variants });
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
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        tagline = COALESCE(?, tagline),
        description = COALESCE(?, description),
        price_cents = COALESCE(?, price_cents),
        compare_at_price_cents = COALESCE(?, compare_at_price_cents),
        image = COALESCE(?, image),
        category = COALESCE(?, category),
        in_stock = COALESCE(?, in_stock),
        stock_qty = COALESCE(?, stock_qty),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.name ?? null,
      body.slug ?? null,
      body.tagline ?? null,
      body.description ?? null,
      body.price_cents ?? null,
      body.compare_at_price_cents ?? null,
      body.image ?? null,
      body.category ?? null,
      body.in_stock !== undefined ? (body.in_stock ? 1 : 0) : null,
      body.stock_qty ?? null,
      now,
      id,
    );

    const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(id);

    createAuditLog(
      admin.id, "update", "product", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(updated);
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
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "true";

    if (hard) {
      db.prepare("DELETE FROM products WHERE id = ?").run(id);
    } else {
      db.prepare("UPDATE products SET in_stock = 0, updated_at = ? WHERE id = ?")
        .run(new Date().toISOString(), id);
    }

    createAuditLog(
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
