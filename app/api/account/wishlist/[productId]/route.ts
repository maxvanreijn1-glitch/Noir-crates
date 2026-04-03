import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ productId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { productId } = await params;

  const wishlists = await sql<[{ id: number }]>`SELECT id FROM wishlists WHERE customer_id = ${customer.id}`;
  const wishlist = wishlists[0];
  if (!wishlist) {
    return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
  }

  await sql`DELETE FROM wishlist_items WHERE wishlist_id = ${wishlist.id} AND product_id = ${productId}`;

  return NextResponse.json({ ok: true });
}
