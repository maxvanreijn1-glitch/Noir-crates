import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = 10;
  const offset = (page - 1) * limit;

  const orders = db.prepare(`
    SELECT o.*, GROUP_CONCAT(
      json_object(
        'id', oi.id,
        'product_name', oi.product_name,
        'quantity', oi.quantity,
        'unit_price_cents', oi.unit_price_cents
      )
    ) as items_json
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `).all(customer.id, limit, offset) as (Record<string, unknown> & { items_json?: string })[];

  const total = (db.prepare("SELECT COUNT(*) as c FROM orders WHERE customer_id = ?")
    .get(customer.id) as { c: number }).c;

  const parsed = orders.map(o => {
    let items: unknown[] = [];
    if (o.items_json) {
      try { items = (o.items_json as string).split(',').map(s => JSON.parse(s)); } catch { items = []; }
    }
    const { items_json: _, ...rest } = o;
    return { ...rest, items };
  });

  return NextResponse.json({ data: parsed, total, pages: Math.ceil(total / limit), page });
}
