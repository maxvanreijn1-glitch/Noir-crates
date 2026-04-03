import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ itemId: string }> };

interface CartItem {
  id: number;
  cart_id: number;
}

async function getCartAndItem(customerId: number, itemId: string): Promise<{ cart: { id: number }; item: CartItem } | null> {
  const cart = db.prepare("SELECT id FROM carts WHERE customer_id = ?")
    .get(customerId) as { id: number } | undefined;
  if (!cart) return null;

  const item = db.prepare("SELECT * FROM cart_items WHERE id = ? AND cart_id = ?")
    .get(itemId, cart.id) as CartItem | undefined;
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

    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(qty, itemId);
    db.prepare("UPDATE carts SET updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), found.cart.id);

    const updated = db.prepare("SELECT * FROM cart_items WHERE id = ?").get(itemId);
    return NextResponse.json(updated);
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

  db.prepare("DELETE FROM cart_items WHERE id = ?").run(itemId);
  db.prepare("UPDATE carts SET updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), found.cart.id);

  return NextResponse.json({ ok: true });
}
