import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "reports:read");
    if (admin instanceof NextResponse) return admin;

    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = new Date().toISOString().slice(0, 7);

    const [
      totalRevenueRow,
      totalOrdersRow,
      ordersTodayRow,
      revenueTodayRow,
      topProducts,
      ordersByStatus,
      revenueByDay,
      totalCustomersRow,
      newCustomersRow,
    ] = await Promise.all([
      sql<[{ total: string }]>`SELECT COALESCE(SUM(total_cents), 0)::bigint AS total FROM orders WHERE status != 'cancelled'`,
      sql<[{ count: string }]>`SELECT COUNT(*) AS count FROM orders`,
      sql<[{ count: string }]>`SELECT COUNT(*) AS count FROM orders WHERE DATE(created_at) = ${todayStr}`,
      sql<[{ total: string }]>`SELECT COALESCE(SUM(total_cents), 0)::bigint AS total FROM orders WHERE DATE(created_at) = ${todayStr} AND status != 'cancelled'`,
      sql`SELECT product_name, SUM(quantity)::bigint AS total_qty FROM order_items GROUP BY product_name ORDER BY total_qty DESC LIMIT 5`,
      sql`SELECT status, COUNT(*)::bigint AS count FROM orders GROUP BY status`,
      sql`SELECT DATE(created_at) AS day, COALESCE(SUM(total_cents), 0)::bigint AS revenue_cents FROM orders WHERE status != 'cancelled' AND created_at >= NOW() - INTERVAL '30 days' GROUP BY day ORDER BY day ASC`,
      sql<[{ count: string }]>`SELECT COUNT(*) AS count FROM customers`,
      sql<[{ count: string }]>`SELECT COUNT(*) AS count FROM customers WHERE TO_CHAR(created_at, 'YYYY-MM') = ${monthStr}`,
    ]);

    return NextResponse.json({
      total_revenue_cents: parseInt(totalRevenueRow[0].total),
      total_orders: parseInt(totalOrdersRow[0].count),
      orders_today: parseInt(ordersTodayRow[0].count),
      revenue_today_cents: parseInt(revenueTodayRow[0].total),
      top_products: topProducts,
      orders_by_status: ordersByStatus,
      revenue_by_day: revenueByDay,
      total_customers: parseInt(totalCustomersRow[0].count),
      new_customers_this_month: parseInt(newCustomersRow[0].count),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
