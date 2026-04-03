import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog, paginatedQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "orders:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const status = searchParams.get("status") ?? "";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    const where = conditions.join(" AND ");
    const result = paginatedQuery("orders", where, params, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "orders:write");
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as Record<string, unknown>;
    const { customer_id, total_cents, items } = body;

    if (total_cents === undefined) {
      return NextResponse.json({ error: "Missing required field: total_cents" }, { status: 400 });
    }

    const orderNumber = `ORD-${Date.now()}`;

    const result = db.prepare(`
      INSERT INTO orders (order_number, customer_id, status, total_cents,
        subtotal_cents, tax_cents, shipping_cents, discount_cents, currency, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNumber,
      customer_id ?? null,
      body.status ?? "pending",
      total_cents,
      body.subtotal_cents ?? total_cents,
      body.tax_cents ?? 0,
      body.shipping_cents ?? 0,
      body.discount_cents ?? 0,
      body.currency ?? "usd",
      body.notes ?? null,
    );

    const orderId = result.lastInsertRowid as number;

    if (Array.isArray(items)) {
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_cents, variant_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const item of items as Record<string, unknown>[]) {
        insertItem.run(
          orderId,
          item.product_id ?? null,
          item.product_name ?? "Unknown",
          item.quantity ?? 1,
          item.unit_price_cents ?? 0,
          item.variant_id ?? null,
        );
      }
    }

    db.prepare(`
      INSERT INTO order_status_history (order_id, status, note, admin_id)
      VALUES (?, ?, ?, ?)
    `).run(orderId, body.status ?? "pending", "Order created manually", admin.id);

    createAuditLog(
      admin.id, "create", "order", orderId,
      { order_number: orderNumber },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
