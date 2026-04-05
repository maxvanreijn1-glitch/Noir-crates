import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import styles from './layout.module.css';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/products', label: 'Products', icon: '🛍️' },
  { href: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/payments', label: 'Payments', icon: '💳' },
  { href: '/admin/shipping', label: 'Shipping', icon: '🚚' },
  { href: '/admin/discounts', label: 'Discounts', icon: '🎟️' },
  { href: '/admin/content', label: 'Content', icon: '📝' },
  { href: '/admin/roles', label: 'Roles & Admins', icon: '🔐' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin/pack-opener', label: 'Pack Opener', icon: '🃏' },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token');

  if (!token) {
    redirect('/admin/login');
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>Noir Crates</span>
          <span className={styles.sidebarAdmin}>Admin</span>
        </div>

        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              <span className={styles.navIcon}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <LogoutButton />
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
