"use client";
import Link from "next/link";
import Logo from "./Logo";
import { useCart } from "@/context/CartContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { count, openCart } = useCart();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <Logo size={30} />
          <span className={styles.brandName}>Noir Crates</span>
        </Link>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Shop</Link>
          <Link href="/blind-boxes" className={styles.navLink}>Blind Boxes</Link>
          <Link href="/about" className={styles.navLink}>About</Link>
          <Link href="/faq" className={styles.navLink}>FAQ</Link>
        </nav>
        <button
          className={styles.cartBtn}
          onClick={openCart}
          aria-label={`Open cart, ${count} items`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {count > 0 && <span className={styles.badge}>{count}</span>}
        </button>
      </div>
    </header>
  );
}
