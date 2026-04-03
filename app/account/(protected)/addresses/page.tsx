'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Address {
  id: number;
  type: string;
  name: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: number;
}

const EMPTY_FORM = { type: 'shipping', name: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'US' };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function load() {
    fetch('/api/account/addresses').then(r => r.json()).then(setAddresses).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function startEdit(a: Address) {
    setEditing(a.id);
    setForm({
      type: a.type, name: a.name ?? '', line1: a.line1, line2: a.line2 ?? '',
      city: a.city, state: a.state ?? '', postal_code: a.postal_code, country: a.country,
    });
    setMsg('');
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setSaving(true);
    try {
      const url = editing ? `/api/account/addresses/${editing}` : '/api/account/addresses';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? 'Save failed'); return; }
      setForm(EMPTY_FORM);
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this address?')) return;
    await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <div className={styles.loading}>Loading…</div>;

  return (
    <div>
      <h1 className={styles.title}>Addresses</h1>

      {addresses.length > 0 ? (
        <div className={styles.grid}>
          {addresses.map(a => (
            <div key={a.id} className={styles.addressCard}>
              <div className={styles.addressBody}>
                {a.name && <p className={styles.addrName}>{a.name}</p>}
                <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                <p>{a.city}{a.state ? `, ${a.state}` : ''} {a.postal_code}</p>
                <p>{a.country}</p>
                {a.is_default ? <span className={styles.defaultBadge}>Default</span> : null}
              </div>
              <div className={styles.addressActions}>
                <button className={styles.btnEdit} onClick={() => startEdit(a)}>Edit</button>
                <button className={styles.btnDelete} onClick={() => handleDelete(a.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No addresses yet.</p>
      )}

      <div className={styles.formCard}>
        <h2 className={styles.cardTitle}>{editing ? 'Edit Address' : 'Add New Address'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          {msg && <div className={styles.error}>{msg}</div>}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={styles.input}>
                <option value="shipping">Shipping</option>
                <option value="billing">Billing</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={styles.input} />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Address Line 1 *</label>
            <input type="text" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} className={styles.input} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Address Line 2</label>
            <input type="text" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} className={styles.input} />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>City *</label>
              <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={styles.input} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>State / Province</label>
              <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className={styles.input} />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Postal Code *</label>
              <input type="text" value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} className={styles.input} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Country *</label>
              <input type="text" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className={styles.input} required />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.btn} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update Address' : 'Add Address'}
            </button>
            {editing && (
              <button type="button" className={styles.btnCancel} onClick={cancelEdit}>Cancel</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
