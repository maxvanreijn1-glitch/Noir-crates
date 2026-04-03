'use client';

import { useRouter } from 'next/navigation';
import styles from './layout.module.css';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/account/login');
  }

  return (
    <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
      Sign Out
    </button>
  );
}
