import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const cart = db.prepare("SELECT * FROM carts WHERE customer_id = ?")
    .get(customer.id) as { id: number } | undefined;
  if (!cart) return NextResponse.json([]);

  const items = db.prepare(
    "SELECT * FROM cart_items WHERE cart_id = ? ORDER BY id ASC"
  ).all(cart.id);
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
    let cart = db.prepare("SELECT * FROM carts WHERE customer_id = ?")
      .get(customer.id) as { id: number } | undefined;
    if (!cart) {
      const res = db.prepare(
        "INSERT INTO carts (customer_id, updated_at) VALUES (?, ?)"
      ).run(customer.id, new Date().toISOString());
      cart = { id: res.lastInsertRowid as number };
    }

    const qty = Math.max(1, body.quantity ?? 1);

    db.prepare(`
      INSERT INTO cart_items (cart_id, product_id, product_name, price_cents, quantity, image)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(cart_id, product_id) DO UPDATE SET
        quantity = excluded.quantity,
        price_cents = excluded.price_cents,
        image = excluded.image
    `).run(cart.id, body.product_id, body.product_name, body.price_cents ?? 0, qty, body.image ?? null);

    db.prepare("UPDATE carts SET updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), cart.id);

    const items = db.prepare("SELECT * FROM cart_items WHERE cart_id = ? ORDER BY id ASC")
      .all(cart.id);
    return NextResponse.json(items, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
