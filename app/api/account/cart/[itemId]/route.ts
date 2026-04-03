import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ itemId: string }> };

interface CartItem {
  id: number;
  cart_id: number;
}

async function getCartAndItem(customerId: number, itemId: string): Promise<{ cart: { id: number }; item: CartItem } | null> {
  const carts = await sql<[{ id: number }]>`SELECT id FROM carts WHERE customer_id = ${customerId}`;
  const cart = carts[0];
  if (!cart) return null;

  const items = await sql<CartItem[]>`SELECT * FROM cart_items WHERE id = ${itemId} AND cart_id = ${cart.id}`;
  const item = items[0];
  if (!item) return null;

  return { cart, item };
}

export async function PUT(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { itemId } = await params;
  const found = await getCartAndItem(customer.id, itemId);
  if (!found) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  try {
    const body = await req.json() as { quantity?: number };
    const qty = body.quantity;

    if (!qty || qty < 1) {
      return NextResponse.json({ error: "quantity must be >= 1" }, { status: 400 });
    }

    await sql`UPDATE cart_items SET quantity = ${qty} WHERE id = ${itemId}`;
    await sql`UPDATE carts SET updated_at = NOW() WHERE id = ${found.cart.id}`;

    const updated = await sql`SELECT * FROM cart_items WHERE id = ${itemId}`;
    return NextResponse.json(updated[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { itemId } = await params;
  const found = await getCartAndItem(customer.id, itemId);
  if (!found) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  await sql`DELETE FROM cart_items WHERE id = ${itemId}`;
  await sql`UPDATE carts SET updated_at = NOW() WHERE id = ${found.cart.id}`;

  return NextResponse.json({ ok: true });
}
