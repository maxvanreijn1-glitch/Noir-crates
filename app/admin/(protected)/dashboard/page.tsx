'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Analytics {
  total_revenue_cents: number;
  total_orders: number;
  orders_today: number;
  revenue_today_cents: number;
  total_customers: number;
  new_customers_this_month: number;
  top_products: { product_name: string; total_qty: number }[];
  orders_by_status: { status: string; count: number }[];
  revenue_by_day: { day: string; revenue_cents: number }[];
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: styles.statusPending,
  processing: styles.statusProcessing,
  shipped: styles.statusShipped,
  delivered: styles.statusDelivered,
  cancelled: styles.statusCancelled,
  refunded: styles.statusRefunded,
};

export default function DashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load analytics'));
  }, []);

  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.loading}>Loading dashboard…</div>;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.sub}>Welcome back — here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Revenue</span>
          <span className={styles.statValue}>{formatCents(data.total_revenue_cents)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Orders</span>
          <span className={styles.statValue}>{data.total_orders}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Customers</span>
          <span className={styles.statValue}>{data.total_customers}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Orders Today</span>
          <span className={styles.statValue}>{data.orders_today}</span>
          <span className={styles.statSub}>{formatCents(data.revenue_today_cents)} today</span>
        </div>
      </div>

      <div className={styles.row}>
        {/* Orders by status */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Orders by Status</h2>
          <div className={styles.statusList}>
            {data.orders_by_status.map((s) => (
              <div key={s.status} className={styles.statusRow}>
                <span className={`${styles.statusBadge} ${STATUS_COLORS[s.status] ?? styles.statusDefault}`}>
                  {s.status}
                </span>
                <span className={styles.statusCount}>{s.count}</span>
              </div>
            ))}
            {data.orders_by_status.length === 0 && (
              <p className={styles.empty}>No orders yet.</p>
            )}
          </div>
        </div>

        {/* Top products */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Top Products</h2>
          {data.top_products.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className={styles.right}>Qty Sold</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((p, i) => (
                  <tr key={i}>
                    <td>{p.product_name}</td>
                    <td className={styles.right}>{p.total_qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.empty}>No sales data yet.</p>
          )}
        </div>
      </div>

      {/* Revenue by day */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Revenue — Last 30 Days</h2>
        {data.revenue_by_day.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th className={styles.right}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.revenue_by_day.map((r) => (
                <tr key={r.day}>
                  <td>{r.day}</td>
                  <td className={styles.right}>{formatCents(r.revenue_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.empty}>No revenue data yet.</p>
        )}
      </div>
    </div>
  );
}
