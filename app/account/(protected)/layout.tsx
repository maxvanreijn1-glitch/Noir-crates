import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { verifyCustomerToken } from '@/lib/customer-auth';
import styles from './layout.module.css';

const navLinks = [
  { href: '/account', label: 'Dashboard', exact: true },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/account/cart', label: 'Cart' },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer_token')?.value;

  if (!token) redirect('/account/login');

  const payload = await verifyCustomerToken(token);
  if (!payload) redirect('/account/login');

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>My Account</span>
          <span className={styles.sidebarEmail}>{payload.email}</span>
        </div>
        <nav className={styles.nav}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/logout" method="POST" className={styles.logoutForm}>
          <button type="submit" className={styles.logoutBtn}>Sign Out</button>
        </form>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
