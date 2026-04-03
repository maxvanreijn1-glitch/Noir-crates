'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';

interface Discount {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  uses_count: number;
  max_uses: number | null;
  is_active: number;
  expires_at: string | null;
  description: string | null;
}

interface PaginatedResponse {
  data: Discount[];
  total: number;
  page: number;
  totalPages: number;
}

interface DiscountForm {
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  description: string;
  max_uses: string;
  expires_at: string;
}

const EMPTY_FORM: DiscountForm = { code: '', type: 'percentage', value: '', description: '', max_uses: '', expires_at: '' };

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      const res = await fetch(`/api/admin/discounts?${params}`);
      const data: PaginatedResponse = await res.json();
      if (!res.ok) { setError((data as { error?: string }).error ?? 'Error'); return; }
      setDiscounts(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: parseFloat(form.value),
          description: form.description || null,
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          expires_at: form.expires_at || null,
          is_active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Error'); return; }
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(d: Discount) {
    await fetch(`/api/admin/discounts/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !d.is_active }),
    });
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this discount?')) return;
    await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Discounts</h1>
          <p className={styles.sub}>{total} discount codes</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className={styles.btnPrimary}>
          {showForm ? 'Cancel' : '+ Add Discount'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className={styles.addForm}>
          <h2 className={styles.formTitle}>New Discount Code</h2>
          {formError && <div className={styles.error}>{formError}</div>}
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label className={styles.label}>Code *</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className={styles.input}
                placeholder="SUMMER20"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}
                className={styles.select}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Value *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className={styles.input}
                placeholder={form.type === 'percentage' ? '20' : '5.00'}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Max Uses</label>
              <input
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                className={styles.input}
                placeholder="Unlimited"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Expires At</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={styles.input}
                placeholder="Optional note"
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className={styles.btnPrimary}>
            {saving ? 'Saving…' : 'Create Discount'}
          </button>
        </form>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Uses</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className={styles.centered}>Loading…</td></tr>
            ) : discounts.length === 0 ? (
              <tr><td colSpan={7} className={styles.centered}>No discounts found.</td></tr>
            ) : discounts.map((d) => (
              <tr key={d.id}>
                <td className={styles.code}>{d.code}</td>
                <td>{d.type}</td>
                <td>{d.type === 'percentage' ? `${d.value}%` : `$${d.value.toFixed(2)}`}</td>
                <td>{d.uses_count}{d.max_uses ? ` / ${d.max_uses}` : ''}</td>
                <td>
                  <span className={d.is_active ? styles.badgeGreen : styles.badgeGrey}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{d.expires_at ? new Date(d.expires_at).toLocaleDateString() : '—'}</td>
                <td className={styles.actions}>
                  <button onClick={() => toggleActive(d)} className={styles.toggleBtn}>
                    {d.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(d.id)} className={styles.deleteBtn}>Delete</button>
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
