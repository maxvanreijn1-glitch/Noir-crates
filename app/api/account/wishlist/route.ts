import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const wishlists = await sql<{ id: number }[]>`SELECT id FROM wishlists WHERE customer_id = ${customer.id}`;
  const wishlist = wishlists[0];
  if (!wishlist) return NextResponse.json([]);

  const items = await sql`SELECT * FROM wishlist_items WHERE wishlist_id = ${wishlist.id} ORDER BY added_at DESC`;
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
    let wishlistRows = await sql<{ id: number }[]>`SELECT id FROM wishlists WHERE customer_id = ${customer.id}`;
    let wishlistId: number;
    if (wishlistRows.length === 0) {
      const [newWl] = await sql<{ id: number }[]>`
        INSERT INTO wishlists (customer_id, updated_at) VALUES (${customer.id}, NOW()) RETURNING id
      `;
      wishlistId = newWl.id;
    } else {
      wishlistId = wishlistRows[0].id;
    }

    await sql`
      INSERT INTO wishlist_items (wishlist_id, product_id, product_name, price_cents, image)
      VALUES (${wishlistId}, ${body.product_id}, ${body.product_name}, ${body.price_cents ?? 0}, ${body.image ?? null})
      ON CONFLICT(wishlist_id, product_id) DO NOTHING
    `;

    await sql`UPDATE wishlists SET updated_at = NOW() WHERE id = ${wishlistId}`;

    const items = await sql`SELECT * FROM wishlist_items WHERE wishlist_id = ${wishlistId} ORDER BY added_at DESC`;
    return NextResponse.json(items, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
