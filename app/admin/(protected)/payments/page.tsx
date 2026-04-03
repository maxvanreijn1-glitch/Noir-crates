'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';

interface Payment {
  id: number;
  order_id: number;
  amount_cents: number;
  status: string;
  provider: string;
  fraud_flag: number;
  created_at: string;
}

interface PaginatedResponse {
  data: Payment[];
  total: number;
  page: number;
  totalPages: number;
}

const PAYMENT_STATUSES = ['', 'pending', 'succeeded', 'failed', 'refunded', 'disputed'];

const STATUS_CLASS: Record<string, string> = {
  pending: 'statusPending',
  succeeded: 'statusSucceeded',
  failed: 'statusFailed',
  refunded: 'statusRefunded',
  disputed: 'statusDisputed',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [fraudOnly, setFraudOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (fraudOnly) params.set('fraud_flag', 'true');
      const res = await fetch(`/api/admin/payments?${params}`);
      const data: PaginatedResponse = await res.json();
      if (!res.ok) { setError((data as { error?: string }).error ?? 'Error'); return; }
      setPayments(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, fraudOnly]);

  useEffect(() => { load(); }, [load]);

  function handleStatusChange(s: string) {
    setStatusFilter(s);
    setPage(1);
  }

  function handleFraudToggle() {
    setFraudOnly((f) => !f);
    setPage(1);
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Payments</h1>
          <p className={styles.sub}>{total} transactions</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={styles.select}
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
          ))}
        </select>
        <label className={styles.fraudToggle}>
          <input type="checkbox" checked={fraudOnly} onChange={handleFraudToggle} />
          Fraud flags only
        </label>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Fraud</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className={styles.centered}>Loading…</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={7} className={styles.centered}>No payments found.</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id}>
                <td className={styles.mono}>#{p.id}</td>
                <td className={styles.mono}>#{p.order_id}</td>
                <td>${(p.amount_cents / 100).toFixed(2)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[p.status] ?? 'statusDefault']}`}>
                    {p.status}
                  </span>
                </td>
                <td>{p.provider}</td>
                <td>
                  {p.fraud_flag ? <span className={styles.fraudBadge}>⚠ Flagged</span> : <span className={styles.clearBadge}>Clear</span>}
                </td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={styles.pageBtn}>← Prev</button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={styles.pageBtn}>Next →</button>
        </div>
      )}
    </div>
  );
}
