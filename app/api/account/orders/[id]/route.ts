import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  const orders = await sql<Record<string, unknown>[]>`
    SELECT * FROM orders WHERE id = ${id} AND customer_id = ${customer.id}
  `;
  const order = orders[0];

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const [items, statusHistory, shipments] = await Promise.all([
    sql`SELECT * FROM order_items WHERE order_id = ${id}`,
    sql`SELECT * FROM order_status_history WHERE order_id = ${id} ORDER BY created_at ASC`,
    sql`SELECT * FROM shipments WHERE order_id = ${id} ORDER BY created_at DESC`,
  ]);

  return NextResponse.json({ ...order, items, status_history: statusHistory, shipments });
}
