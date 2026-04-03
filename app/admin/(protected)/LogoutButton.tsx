'use client';

import { useState } from 'react';
import styles from './LogoutButton.module.css';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/admin/login';
    }
  }

  return (
    <div className={styles.wrapper}>
      <button onClick={handleLogout} disabled={loading} className={styles.btn}>
        {loading ? 'Signing out…' : '← Sign Out'}
      </button>
    </div>
  );
}
