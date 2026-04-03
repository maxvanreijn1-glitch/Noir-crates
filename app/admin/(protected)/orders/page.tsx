'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Order {
  id: number;
  order_number: string;
  customer_id: number | null;
  status: string;
  total_cents: number;
  created_at: string;
}

interface PaginatedResponse {
  data: Order[];
  total: number;
  page: number;
  totalPages: number;
}

const ORDER_STATUSES = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_CLASS: Record<string, string> = {
  pending: 'statusPending',
  processing: 'statusProcessing',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
  refunded: 'statusRefunded',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data: PaginatedResponse = await res.json();
      if (!res.ok) { setError((data as { error?: string }).error ?? 'Error'); return; }
      setOrders(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function handleStatusChange(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.sub}>{total} total orders</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={styles.select}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
          ))}
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer ID</th>
              <th>Status</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.centered}>Loading…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className={styles.centered}>No orders found.</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id}>
                <td className={styles.bold}>{o.order_number}</td>
                <td>{o.customer_id ?? '—'}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[o.status] ?? 'statusDefault']}`}>
                    {o.status}
                  </span>
                </td>
                <td>${(o.total_cents / 100).toFixed(2)}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <Link href={`/admin/orders/${o.id}`} className={styles.linkBtn}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={styles.pageBtn}>← Prev</button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={styles.pageBtn}>Next →</button>
        </div>
      )}
    </div>
  );
}
