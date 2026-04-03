import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "reports:read");
    if (admin instanceof NextResponse) return admin;

    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = new Date().toISOString().slice(0, 7);

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_cents), 0) AS total
      FROM orders WHERE status != 'cancelled'
    `).get() as { total: number };

    const totalOrders = db.prepare(`
      SELECT COUNT(*) AS count FROM orders
    `).get() as { count: number };

    const ordersToday = db.prepare(`
      SELECT COUNT(*) AS count FROM orders
      WHERE date(created_at) = ?
    `).get(todayStr) as { count: number };

    const revenueToday = db.prepare(`
      SELECT COALESCE(SUM(total_cents), 0) AS total
      FROM orders WHERE date(created_at) = ? AND status != 'cancelled'
    `).get(todayStr) as { total: number };

    const topProducts = db.prepare(`
      SELECT product_name, SUM(quantity) AS total_qty
      FROM order_items
      GROUP BY product_name
      ORDER BY total_qty DESC
      LIMIT 5
    `).all();

    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) AS count
      FROM orders
      GROUP BY status
    `).all();

    const revenueByDay = db.prepare(`
      SELECT date(created_at) AS day, COALESCE(SUM(total_cents), 0) AS revenue_cents
      FROM orders
      WHERE status != 'cancelled'
        AND created_at >= date('now', '-30 days')
      GROUP BY day
      ORDER BY day ASC
    `).all();

    const totalCustomers = db.prepare(`
      SELECT COUNT(*) AS count FROM customers
    `).get() as { count: number };

    const newCustomersThisMonth = db.prepare(`
      SELECT COUNT(*) AS count FROM customers
      WHERE strftime('%Y-%m', created_at) = ?
    `).get(monthStr) as { count: number };

    return NextResponse.json({
      total_revenue_cents: totalRevenue.total,
      total_orders: totalOrders.count,
      orders_today: ordersToday.count,
      revenue_today_cents: revenueToday.total,
      top_products: topProducts,
      orders_by_status: ordersByStatus,
      revenue_by_day: revenueByDay,
      total_customers: totalCustomers.count,
      new_customers_this_month: newCustomersThisMonth.count,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
