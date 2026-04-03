import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const carts = await sql<{ id: number }[]>`SELECT id FROM carts WHERE customer_id = ${customer.id}`;
  const cart = carts[0];
  if (!cart) return NextResponse.json([]);

  const items = await sql`SELECT * FROM cart_items WHERE cart_id = ${cart.id} ORDER BY id ASC`;
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  try {
    const body = await req.json() as {
      product_id?: string; product_name?: string; price_cents?: number;
      quantity?: number; image?: string;
    };

    if (!body.product_id || !body.product_name) {
      return NextResponse.json({ error: "product_id and product_name are required" }, { status: 400 });
    }

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

    const qty = Math.max(1, body.quantity ?? 1);

    await sql`
      INSERT INTO cart_items (cart_id, product_id, product_name, price_cents, quantity, image)
      VALUES (${cartId}, ${body.product_id}, ${body.product_name}, ${body.price_cents ?? 0}, ${qty}, ${body.image ?? null})
      ON CONFLICT(cart_id, product_id) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        price_cents = EXCLUDED.price_cents,
        image = EXCLUDED.image
    `;

    await sql`UPDATE carts SET updated_at = NOW() WHERE id = ${cartId}`;

    const items = await sql`SELECT * FROM cart_items WHERE cart_id = ${cartId} ORDER BY id ASC`;
    return NextResponse.json(items, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
