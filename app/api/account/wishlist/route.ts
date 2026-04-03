import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const wishlist = db.prepare("SELECT * FROM wishlists WHERE customer_id = ?").get(customer.id) as { id: number } | undefined;
  if (!wishlist) return NextResponse.json([]);

  const items = db.prepare(
    "SELECT * FROM wishlist_items WHERE wishlist_id = ? ORDER BY added_at DESC"
  ).all(wishlist.id);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  try {
    const body = await req.json() as {
      product_id?: string; product_name?: string; price_cents?: number; image?: string;
    };

    if (!body.product_id || !body.product_name) {
      return NextResponse.json({ error: "product_id and product_name are required" }, { status: 400 });
    }

    // Ensure wishlist exists
    let wishlist = db.prepare("SELECT * FROM wishlists WHERE customer_id = ?")
      .get(customer.id) as { id: number } | undefined;
    if (!wishlist) {
      const res = db.prepare(
        "INSERT INTO wishlists (customer_id, updated_at) VALUES (?, ?)"
      ).run(customer.id, new Date().toISOString());
      wishlist = { id: res.lastInsertRowid as number };
    }

    db.prepare(`
      INSERT OR IGNORE INTO wishlist_items (wishlist_id, product_id, product_name, price_cents, image)
      VALUES (?, ?, ?, ?, ?)
    `).run(wishlist.id, body.product_id, body.product_name, body.price_cents ?? 0, body.image ?? null);

    db.prepare("UPDATE wishlists SET updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), wishlist.id);

    const items = db.prepare("SELECT * FROM wishlist_items WHERE wishlist_id = ? ORDER BY added_at DESC")
      .all(wishlist.id);
    return NextResponse.json(items, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
