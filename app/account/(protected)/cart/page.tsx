'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface CartItem {
  id: number;
  product_id: string;
  product_name: string;
  price_cents: number;
  quantity: number;
  image: string | null;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  function load() {
    fetch('/api/account/cart')
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleQuantity(id: number, quantity: number) {
    if (quantity < 1) return;
    setUpdating(id);
    await fetch(`/api/account/cart/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    setUpdating(null);
    load();
  }

  async function handleRemove(id: number) {
    await fetch(`/api/account/cart/${id}`, { method: 'DELETE' });
    load();
  }

  const total = items.reduce((s, i) => s + i.price_cents * i.quantity, 0);

  if (loading) return <div className={styles.loading}>Loading cart…</div>;

  return (
    <div>
      <h1 className={styles.title}>Cart</h1>
      {items.length === 0 ? (
        <p className={styles.empty}>Your cart is empty.</p>
      ) : (
        <>
          <div className={styles.itemList}>
            {items.map(item => (
              <div key={item.id} className={styles.item}>
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.product_name} className={styles.image} />
                )}
                <div className={styles.itemInfo}>
                  <div className={styles.productName}>{item.product_name}</div>
                  <div className={styles.price}>${(item.price_cents / 100).toFixed(2)} each</div>
                </div>
                <div className={styles.qtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleQuantity(item.id, item.quantity - 1)}
                    disabled={updating === item.id || item.quantity <= 1}
                  >−</button>
                  <span className={styles.qty}>{item.quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => handleQuantity(item.id, item.quantity + 1)}
                    disabled={updating === item.id}
                  >+</button>
                </div>
                <div className={styles.lineTotal}>
                  ${((item.price_cents * item.quantity) / 100).toFixed(2)}
                </div>
                <button className={styles.removeBtn} onClick={() => handleRemove(item.id)}>✕</button>
              </div>
            ))}
          </div>
          <div className={styles.footer}>
            <div className={styles.total}>
              Total: <strong>${(total / 100).toFixed(2)}</strong>
            </div>
          <a href="/" className={styles.checkoutBtn}>Checkout</a>
          </div>
        </>
      )}
    </div>
  );
}
