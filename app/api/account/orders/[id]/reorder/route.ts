import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  const orders = await sql`SELECT id FROM orders WHERE id = ${id} AND customer_id = ${customer.id}`;
  if (orders.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const items = await sql<{ product_id: number | null; product_name: string; quantity: number; unit_price_cents: number }[]>`
    SELECT * FROM order_items WHERE order_id = ${id}
  `;

  // Ensure cart exists
  let cartRows = await sql<{ id: number }[]>`SELECT id FROM carts WHERE customer_id = ${customer.id}`;
  let cartId: number;
  if (cartRows.length === 0) {
    const [newCart] = await sql<{ id: number }[]>`
      INSERT INTO carts (customer_id, updated_at) VALUES (${customer.id}, NOW()) RETURNING id
    `;
    cartId = newCart.id;
  } else {
    cartId = cartRows[0].id;
  }

  for (const item of items) {
    const productId = item.product_id ? String(item.product_id) : item.product_name;
    await sql`
      INSERT INTO cart_items (cart_id, product_id, product_name, price_cents, quantity)
      VALUES (${cartId}, ${productId}, ${item.product_name}, ${item.unit_price_cents}, ${item.quantity})
      ON CONFLICT(cart_id, product_id) DO UPDATE SET
        quantity = cart_items.quantity + EXCLUDED.quantity
    `;
  }

  await sql`UPDATE carts SET updated_at = NOW() WHERE id = ${cartId}`;

  return NextResponse.json({ ok: true, cart_id: cartId });
}
