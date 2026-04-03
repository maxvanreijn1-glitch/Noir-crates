import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  const order = db.prepare(
    "SELECT * FROM orders WHERE id = ? AND customer_id = ?"
  ).get(id, customer.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?")
    .all(id) as { product_id: number | null; product_name: string; quantity: number; unit_price_cents: number }[];

  // Ensure cart exists
  let cart = db.prepare("SELECT * FROM carts WHERE customer_id = ?").get(customer.id) as { id: number } | undefined;
  if (!cart) {
    const res = db.prepare(
      "INSERT INTO carts (customer_id, updated_at) VALUES (?, ?)"
    ).run(customer.id, new Date().toISOString());
    cart = { id: res.lastInsertRowid as number };
  }

  const now = new Date().toISOString();
  for (const item of items) {
    const productId = item.product_id ? String(item.product_id) : item.product_name;
    db.prepare(`
      INSERT INTO cart_items (cart_id, product_id, product_name, price_cents, quantity)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(cart_id, product_id) DO UPDATE SET
        quantity = quantity + excluded.quantity
    `).run(cart.id, productId, item.product_name, item.unit_price_cents, item.quantity);
  }

  db.prepare("UPDATE carts SET updated_at = ? WHERE id = ?").run(now, cart.id);

  return NextResponse.json({ ok: true, cart_id: cart.id });
}
