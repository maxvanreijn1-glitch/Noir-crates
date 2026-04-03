'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Customer {
  id: number;
  name: string | null;
  email: string;
  total_orders?: number;
  is_banned: number;
  created_at: string;
}

interface PaginatedResponse {
  data: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/customers?${params}`);
      const data: PaginatedResponse = await res.json();
      if (!res.ok) { setError((data as { error?: string }).error ?? 'Error'); return; }
      setCustomers(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function toggleBan(customer: Customer) {
    const newBanned = !customer.is_banned;
    await fetch(`/api/admin/customers/${customer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_banned: newBanned }),
    });
    load();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.sub}>{total} total customers</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="search"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.btnSecondary}>Search</button>
        </form>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className={styles.centered}>Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className={styles.centered}>No customers found.</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id}>
                <td className={styles.bold}>{c.name ?? '—'}</td>
                <td>{c.email}</td>
                <td>
                  {c.is_banned ? (
                    <span className={styles.badgeRed}>Banned</span>
                  ) : (
                    <span className={styles.badgeGreen}>Active</span>
                  )}
                </td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td className={styles.actions}>
                  <Link href={`/admin/customers/${c.id}`} className={styles.linkBtn}>View</Link>
                  <button
                    onClick={() => toggleBan(c)}
                    className={c.is_banned ? styles.unbanBtn : styles.banBtn}
                  >
                    {c.is_banned ? 'Unban' : 'Ban'}
                  </button>
                </td>
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
