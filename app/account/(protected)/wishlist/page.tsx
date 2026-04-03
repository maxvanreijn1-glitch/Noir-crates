'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface WishlistItem {
  id: number;
  product_id: string;
  product_name: string;
  price_cents: number;
  image: string | null;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  function load() {
    fetch('/api/account/wishlist')
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleRemove(productId: string) {
    await fetch(`/api/account/wishlist/${productId}`, { method: 'DELETE' });
    load();
  }

  async function handleAddToCart(item: WishlistItem) {
    setAdding(item.product_id);
    try {
      await fetch('/api/account/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: item.product_id,
          product_name: item.product_name,
          price_cents: item.price_cents,
          quantity: 1,
          image: item.image,
        }),
      });
    } finally {
      setAdding(null);
    }
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div>
      <h1 className={styles.title}>Wishlist</h1>
      {items.length === 0 ? (
        <p className={styles.empty}>Your wishlist is empty.</p>
      ) : (
        <div className={styles.grid}>
          {items.map(item => (
            <div key={item.id} className={styles.card}>
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.product_name} className={styles.image} />
              )}
              <div className={styles.info}>
                <div className={styles.productName}>{item.product_name}</div>
                <div className={styles.price}>${(item.price_cents / 100).toFixed(2)}</div>
              </div>
              <div className={styles.actions}>
                <button
                  className={styles.addBtn}
                  onClick={() => handleAddToCart(item)}
                  disabled={adding === item.product_id}
                >
                  {adding === item.product_id ? 'Adding…' : 'Add to Cart'}
                </button>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemove(item.product_id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
