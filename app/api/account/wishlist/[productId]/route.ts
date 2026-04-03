import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ productId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { productId } = await params;

  const wishlist = db.prepare("SELECT id FROM wishlists WHERE customer_id = ?")
    .get(customer.id) as { id: number } | undefined;
  if (!wishlist) {
    return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?")
    .run(wishlist.id, productId);

  return NextResponse.json({ ok: true });
}
