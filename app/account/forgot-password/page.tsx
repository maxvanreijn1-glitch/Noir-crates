'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setSent(true);
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
          <p className={styles.subtitle}>Reset Password</p>
        </div>
        {sent ? (
          <div className={styles.successBox}>
            <p>If that email exists, a reset link has been sent. Check your inbox.</p>
            <Link href="/account/login" className={styles.link}>Back to login →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            <p className={styles.hint}>Enter your email and we will send you a reset link.</p>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                className={styles.input} placeholder="you@example.com"
                required autoComplete="email"
              />
            </div>
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <div className={styles.links}>
          <Link href="/account/login" className={styles.link}>← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
