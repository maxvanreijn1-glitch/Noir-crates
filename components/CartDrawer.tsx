"use client";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import styles from "./CartDrawer.module.css";
import { useState } from "react";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div className={styles.overlay} onClick={closeCart} aria-hidden="true" />
      )}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.open : ""}`}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Your Crate</h2>
          <button className={styles.closeBtn} onClick={closeCart} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>Your crate is empty.</p>
            <p>Add a mystery box to begin.</p>
          </div>
        ) : (
          <>
            <ul className={styles.itemList}>
              {items.map((item) => (
                <li key={item.product.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={60}
                      height={60}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.product.name}</p>
                    <p className={styles.itemPrice}>{item.product.priceDisplay}</p>
                    <div className={styles.qtyRow}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span className={styles.qty}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.product.id)}
                    aria-label={`Remove ${item.product.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Total</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button
                className={styles.checkoutBtn}
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? "Preparing…" : "Checkout with Stripe"}
              </button>
              <button className={styles.clearBtn} onClick={clearCart}>
                Clear crate
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
