import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  const order = db.prepare(
    "SELECT * FROM orders WHERE id = ? AND customer_id = ?"
  ).get(id, customer.id) as Record<string, unknown> | undefined;

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
  const statusHistory = db.prepare(
    "SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC"
  ).all(id);
  const shipments = db.prepare(
    "SELECT * FROM shipments WHERE order_id = ? ORDER BY created_at DESC"
  ).all(id);

  return NextResponse.json({ ...order, items, status_history: statusHistory, shipments });
}
