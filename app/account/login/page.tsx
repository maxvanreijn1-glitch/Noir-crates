'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Login failed');
        return;
      }
      window.location.href = '/account';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Noir Crates</h1>
          <p className={styles.subtitle}>My Account</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input} placeholder="you@example.com"
              required autoComplete="email"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              className={styles.input} placeholder="••••••••"
              required autoComplete="current-password"
            />
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className={styles.links}>
          <Link href="/account/forgot-password" className={styles.link}>Forgot password?</Link>
          <span className={styles.sep}>·</span>
          <Link href="/account/signup" className={styles.link}>Create account</Link>
        </div>
      </div>
    </div>
  );
}
