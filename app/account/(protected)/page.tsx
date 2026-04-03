import Link from 'next/link';
import styles from './page.module.css';

const sections = [
  { href: '/account/profile', label: 'Profile', desc: 'Name, email, phone, password', icon: '👤' },
  { href: '/account/addresses', label: 'Addresses', desc: 'Manage shipping addresses', icon: '📍' },
  { href: '/account/orders', label: 'Orders', desc: 'View order history & invoices', icon: '📦' },
  { href: '/account/wishlist', label: 'Wishlist', desc: 'Saved items', icon: '❤️' },
  { href: '/account/cart', label: 'Cart', desc: 'Items in your cart', icon: '🛒' },
];

export default function AccountDashboard() {
  return (
    <div>
      <h1 className={styles.title}>Account Dashboard</h1>
      <p className={styles.sub}>Manage your account, orders and preferences.</p>
      <div className={styles.grid}>
        {sections.map(s => (
          <Link key={s.href} href={s.href} className={styles.card}>
            <span className={styles.icon}>{s.icon}</span>
            <div>
              <div className={styles.cardTitle}>{s.label}</div>
              <div className={styles.cardDesc}>{s.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
