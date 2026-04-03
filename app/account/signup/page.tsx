'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Signup failed');
        return;
      }
      setSuccess(true);
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
          <p className={styles.subtitle}>Create Account</p>
        </div>
        {success ? (
          <div className={styles.successBox}>
            <p>Account created! Check your email to verify your account.</p>
            <Link href="/account/login" className={styles.link}>Sign in →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>Name</label>
              <input
                id="name" type="text" value={name}
                onChange={e => setName(e.target.value)}
                className={styles.input} placeholder="Your name"
                autoComplete="name"
              />
            </div>
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
                className={styles.input} placeholder="Min. 8 characters"
                required autoComplete="new-password" minLength={8}
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
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
        <div className={styles.links}>
          <span>Already have an account?</span>
          <Link href="/account/login" className={styles.link}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
