import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "orders:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;
    const status = searchParams.get("status") ?? "";

    let data, countResult;

    if (status) {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM orders WHERE status = ${status}`;
      data = await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM orders`;
      data = await sql`SELECT * FROM orders ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
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
    const admin = await requireAdmin(req, "orders:write");
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as Record<string, unknown>;
    const { customer_id, total_cents, items } = body;

    if (total_cents === undefined) {
      return NextResponse.json({ error: "Missing required field: total_cents" }, { status: 400 });
    }

    const orderNumber = `ORD-${Date.now()}`;
    const orderStatus = (body.status as string) ?? "pending";

    const [order] = await sql<[{ id: number }]>`
      INSERT INTO orders (order_number, customer_id, status, total_cents,
        subtotal_cents, tax_cents, shipping_cents, discount_cents, currency, notes)
      VALUES (
        ${orderNumber},
        ${customer_id as number | null ?? null},
        ${orderStatus},
        ${total_cents as number},
        ${body.subtotal_cents as number ?? total_cents as number},
        ${body.tax_cents as number ?? 0},
        ${body.shipping_cents as number ?? 0},
        ${body.discount_cents as number ?? 0},
        ${(body.currency as string) ?? "usd"},
        ${body.notes as string | null ?? null}
      )
      RETURNING id
    `;
    const orderId = order.id;

    if (Array.isArray(items)) {
      for (const item of items as Record<string, unknown>[]) {
        await sql`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price_cents, variant_id)
          VALUES (
            ${orderId},
            ${item.product_id as number | null ?? null},
            ${(item.product_name as string) ?? "Unknown"},
            ${item.quantity as number ?? 1},
            ${item.unit_price_cents as number ?? 0},
            ${item.variant_id as number | null ?? null}
          )
        `;
      }
    }

    await sql`
      INSERT INTO order_status_history (order_id, status, note, admin_id)
      VALUES (${orderId}, ${orderStatus}, 'Order created manually', ${admin.id})
    `;

    await createAuditLog(
      admin.id, "create", "order", orderId,
      { order_number: orderNumber },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const created = await sql`SELECT * FROM orders WHERE id = ${orderId}`;
    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
