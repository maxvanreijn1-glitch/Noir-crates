'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

interface StatusHistory {
  id: number;
  status: string;
  note: string | null;
  created_at: string;
}

interface Order {
  id: number;
  order_number: string;
  customer_id: number | null;
  status: string;
  total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  discount_cents: number;
  currency: string;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
  status_history: StatusHistory[];
}

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const STATUS_CLASS: Record<string, string> = {
  pending: 'statusPending',
  processing: 'statusProcessing',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
  refunded: 'statusRefunded',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setOrder(d);
        setNewStatus(d.status);
      })
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!order) return;
    setUpdating(true);
    setUpdateMsg('');
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: statusNote }),
      });
      const data = await res.json();
      if (!res.ok) { setUpdateMsg(data.error ?? 'Update failed'); return; }
      setOrder((o) => o ? { ...o, status: data.status } : o);
      setStatusNote('');
      setUpdateMsg('Status updated.');
      // Reload to refresh history
      const full = await fetch(`/api/admin/orders/${id}`).then(r => r.json());
      if (!full.error) setOrder(full);
    } catch {
      setUpdateMsg('Network error');
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel this order?')) return;
    setUpdating(true);
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', note: 'Cancelled by admin' }),
      });
      const full = await fetch(`/api/admin/orders/${id}`).then(r => r.json());
      if (!full.error) { setOrder(full); setNewStatus('cancelled'); }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading order…</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!order) return null;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Order {order.order_number}</h1>
          <p className={styles.sub}>Placed {new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div className={styles.headerActions}>
          <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[order.status] ?? 'statusDefault']}`}>
            {order.status}
          </span>
          <button onClick={() => router.push('/admin/orders')} className={styles.backBtn}>← Back</button>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.grid2}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Order Summary</h2>
          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}><span>Customer ID</span><span>{order.customer_id ?? 'Guest'}</span></div>
            <div className={styles.summaryRow}><span>Subtotal</span><span>${(order.subtotal_cents / 100).toFixed(2)}</span></div>
            <div className={styles.summaryRow}><span>Tax</span><span>${(order.tax_cents / 100).toFixed(2)}</span></div>
            <div className={styles.summaryRow}><span>Shipping</span><span>${(order.shipping_cents / 100).toFixed(2)}</span></div>
            <div className={styles.summaryRow}><span>Discount</span><span>-${(order.discount_cents / 100).toFixed(2)}</span></div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}><span>Total</span><span>${(order.total_cents / 100).toFixed(2)}</span></div>
          </div>
          {order.notes && <p className={styles.notes}><strong>Notes:</strong> {order.notes}</p>}
        </div>

        {/* Status update */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Update Status</h2>
          <form onSubmit={handleStatusUpdate} className={styles.statusForm}>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className={styles.select}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Note (optional)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className={styles.input}
            />
            <button type="submit" disabled={updating} className={styles.btnPrimary}>
              {updating ? 'Updating…' : 'Update Status'}
            </button>
            {updateMsg && <p className={styles.updateMsg}>{updateMsg}</p>}
          </form>
          <div className={styles.dangerZone}>
            <button onClick={handleCancel} disabled={updating || order.status === 'cancelled'} className={styles.btnDanger}>
              Cancel Order
            </button>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Line Items</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th className={styles.right}>Qty</th>
              <th className={styles.right}>Unit Price</th>
              <th className={styles.right}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td className={styles.right}>{item.quantity}</td>
                <td className={styles.right}>${(item.unit_price_cents / 100).toFixed(2)}</td>
                <td className={styles.right}>${(item.subtotal_cents / 100).toFixed(2)}</td>
              </tr>
            ))}
            {order.items.length === 0 && (
              <tr><td colSpan={4} className={styles.centered}>No items.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status history */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Status History</h2>
        {order.status_history.length === 0 ? (
          <p className={styles.empty}>No history yet.</p>
        ) : (
          <div className={styles.timeline}>
            {order.status_history.map((h) => (
              <div key={h.id} className={styles.timelineItem}>
                <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[h.status] ?? 'statusDefault']}`}>
                  {h.status}
                </span>
                <span className={styles.timelineDate}>{new Date(h.created_at).toLocaleString()}</span>
                {h.note && <span className={styles.timelineNote}>{h.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
