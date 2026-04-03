'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price_cents: number;
}

interface Shipment {
  id: number;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  shipped_at: string | null;
  estimated_delivery: string | null;
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
  status: string;
  total_cents: number;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  discount_cents: number;
  currency: string;
  created_at: string;
  items: OrderItem[];
  status_history: StatusHistory[];
  shipments: Shipment[];
}

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    fetch(`/api/account/orders/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setOrder(d);
      })
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReorder() {
    setReordering(true);
    try {
      const res = await fetch(`/api/account/orders/${id}/reorder`, { method: 'POST' });
      if (res.ok) router.push('/account/cart');
    } finally {
      setReordering(false);
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
          <p className={styles.sub}>{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className={styles.headerActions}>
          <a
            href={`/api/account/orders/${id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.invoiceBtn}
          >
            Download Invoice
          </a>
          <button onClick={handleReorder} disabled={reordering} className={styles.reorderBtn}>
            {reordering ? 'Adding…' : 'Reorder'}
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Items</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th className={styles.center}>Qty</th>
              <th className={styles.right}>Price</th>
              <th className={styles.right}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td className={styles.center}>{item.quantity}</td>
                <td className={styles.right}>${(item.unit_price_cents / 100).toFixed(2)}</td>
                <td className={styles.right}>${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.totals}>
          {order.shipping_cents > 0 && (
            <div className={styles.totalRow}><span>Shipping</span><span>${(order.shipping_cents / 100).toFixed(2)}</span></div>
          )}
          {order.tax_cents > 0 && (
            <div className={styles.totalRow}><span>Tax</span><span>${(order.tax_cents / 100).toFixed(2)}</span></div>
          )}
          {order.discount_cents > 0 && (
            <div className={styles.totalRow}><span>Discount</span><span>-${(order.discount_cents / 100).toFixed(2)}</span></div>
          )}
          <div className={`${styles.totalRow} ${styles.totalFinal}`}>
            <span>Total</span>
            <span>${(order.total_cents / 100).toFixed(2)} {order.currency.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {order.shipments.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Shipment</h2>
          {order.shipments.map(s => (
            <div key={s.id} className={styles.shipmentInfo}>
              {s.carrier && <p><strong>Carrier:</strong> {s.carrier}</p>}
              {s.tracking_number && <p><strong>Tracking:</strong> {s.tracking_number}</p>}
              <p><strong>Status:</strong> {s.status}</p>
              {s.shipped_at && <p><strong>Shipped:</strong> {new Date(s.shipped_at).toLocaleDateString()}</p>}
              {s.estimated_delivery && <p><strong>Est. Delivery:</strong> {new Date(s.estimated_delivery).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}

      {order.status_history.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Status History</h2>
          <div className={styles.timeline}>
            {order.status_history.map(h => (
              <div key={h.id} className={styles.timelineItem}>
                <span className={styles.timelineDot} />
                <div>
                  <div className={styles.timelineStatus}>{h.status}</div>
                  {h.note && <div className={styles.timelineNote}>{h.note}</div>}
                  <div className={styles.timelineDate}>{new Date(h.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
