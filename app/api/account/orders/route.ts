import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

interface OrderRow {
  id: number;
  [key: string]: unknown;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
}

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const limit = 10;
  const offset = (page - 1) * limit;

  const orders = await sql<OrderRow[]>`
    SELECT * FROM orders
    WHERE customer_id = ${customer.id}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countResult = await sql<[{ count: string }]>`
    SELECT COUNT(*) as count FROM orders WHERE customer_id = ${customer.id}
  `;
  const total = parseInt(countResult[0].count);

  // Fetch items for each order
  const parsed = await Promise.all(
    orders.map(async (order) => {
      const items = await sql<OrderItem[]>`SELECT * FROM order_items WHERE order_id = ${order.id}`;
      return { ...order, items };
    })
  );

  return NextResponse.json({ data: parsed, total, pages: Math.ceil(total / limit), page });
}
