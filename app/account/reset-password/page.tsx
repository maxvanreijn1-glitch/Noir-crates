'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Reset failed');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <div className={styles.error}>Invalid or missing reset token.</div>;
  }

  return success ? (
    <div className={styles.successBox}>
      <p>Password reset successfully!</p>
      <Link href="/account/login" className={styles.link}>Sign in →</Link>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>New Password</label>
        <input
          id="password" type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          className={styles.input} placeholder="Min. 8 characters"
          required minLength={8} autoComplete="new-password"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="confirm" className={styles.label}>Confirm Password</label>
        <input
          id="confirm" type="password" value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className={styles.input} placeholder="••••••••"
          required autoComplete="new-password"
        />
      </div>
      <button type="submit" className={styles.btn} disabled={loading}>
        {loading ? 'Resetting…' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Noir Crates</h1>
          <p className={styles.subtitle}>Set New Password</p>
        </div>
        <Suspense fallback={<div>Loading…</div>}>
          <ResetForm />
        </Suspense>
        <div className={styles.links}>
          <Link href="/account/login" className={styles.link}>← Back to login</Link>
        </div>
      </div>
    </div>
  );
}
