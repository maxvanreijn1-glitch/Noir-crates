'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_cents: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'statusPending',
  processing: 'statusProcessing',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
  refunded: 'statusRefunded',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  function load(p: number) {
    setLoading(true);
    fetch(`/api/account/orders?page=${p}`)
      .then(r => r.json())
      .then(d => { setOrders(d.data ?? []); setPages(d.pages ?? 1); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(page); }, [page]);

  if (loading) return <div className={styles.loading}>Loading orders…</div>;

  return (
    <div>
      <h1 className={styles.title}>Order History</h1>
      {orders.length === 0 ? (
        <div className={styles.empty}>
          <p>No orders yet.</p>
          <Link href="/" className={styles.shopLink}>Start shopping →</Link>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className={styles.right}>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className={styles.bold}>{o.order_number}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[STATUS_COLORS[o.status] ?? 'statusDefault']}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className={styles.right}>${(o.total_cents / 100).toFixed(2)}</td>
                    <td>
                      <Link href={`/account/orders/${o.id}`} className={styles.viewLink}>View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className={styles.pagination}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>← Prev</button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
