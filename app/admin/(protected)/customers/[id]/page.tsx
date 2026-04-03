'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Address {
  id: number;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface CustomerNote {
  id: number;
  note: string;
  created_at: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_cents: number;
  created_at: string;
}

interface Customer {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  is_banned: number;
  ban_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  orders: Order[];
  addresses: Address[];
  notes: CustomerNote[];
  total_spend_cents?: number;
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'statusPending',
  processing: 'statusProcessing',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
  refunded: 'statusRefunded',
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesMsg, setNotesMsg] = useState('');

  function load() {
    setLoading(true);
    fetch(`/api/admin/customers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setCustomer(d);
        setAdminNotes(d.admin_notes ?? '');
      })
      .catch(() => setError('Failed to load customer'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteInput.trim()) return;
    setAddingNote(true);
    try {
      await fetch(`/api/admin/customers/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteInput }),
      });
      setNoteInput('');
      load();
    } finally {
      setAddingNote(false);
    }
  }

  async function toggleBan() {
    if (!customer) return;
    const newBanned = !customer.is_banned;
    if (newBanned && !banReason.trim()) {
      alert('Enter a ban reason.');
      return;
    }
    setUpdating(true);
    try {
      await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: newBanned, ban_reason: newBanned ? banReason : null }),
      });
      load();
      setBanReason('');
    } finally {
      setUpdating(false);
    }
  }

  async function handleSaveAdminNotes(e: React.FormEvent) {
    e.preventDefault();
    setSavingNotes(true);
    setNotesMsg('');
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      if (res.ok) setNotesMsg('Saved.');
      else setNotesMsg('Save failed.');
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading customer…</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!customer) return null;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{customer.name ?? customer.email}</h1>
          <p className={styles.sub}>Customer #{customer.id} · Joined {new Date(customer.created_at).toLocaleDateString()}</p>
        </div>
        <button onClick={() => router.push('/admin/customers')} className={styles.backBtn}>← Back</button>
      </div>

      <div className={styles.grid2}>
        {/* Customer info */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Customer Info</h2>
          <div className={styles.infoRows}>
            <div className={styles.infoRow}><span>Name</span><span>{customer.name ?? '—'}</span></div>
            <div className={styles.infoRow}><span>Email</span><span>{customer.email}</span></div>
            <div className={styles.infoRow}><span>Phone</span><span>{customer.phone ?? '—'}</span></div>
            <div className={styles.infoRow}>
              <span>Status</span>
              <span className={customer.is_banned ? styles.badgeRed : styles.badgeGreen}>
                {customer.is_banned ? 'Banned' : 'Active'}
              </span>
            </div>
            {customer.ban_reason && (
              <div className={styles.infoRow}><span>Ban Reason</span><span>{customer.ban_reason}</span></div>
            )}
            {customer.total_spend_cents !== undefined && (
              <div className={styles.infoRow}>
                <span>Total Spend</span>
                <span>${(customer.total_spend_cents / 100).toFixed(2)}</span>
              </div>
            )}
            {customer.admin_notes && (
              <div className={styles.infoRow}><span>Admin Notes</span><span>{customer.admin_notes}</span></div>
            )}
          </div>
        </div>

        {/* Ban / Unban */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{customer.is_banned ? 'Unban Customer' : 'Ban Customer'}</h2>
          {!customer.is_banned && (
            <input
              type="text"
              placeholder="Ban reason…"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className={styles.input}
            />
          )}
          <button
            onClick={toggleBan}
            disabled={updating}
            className={customer.is_banned ? styles.btnSuccess : styles.btnDanger}
          >
            {updating ? 'Updating…' : customer.is_banned ? 'Unban Customer' : 'Ban Customer'}
          </button>
        </div>
      </div>

      {/* Addresses */}
      {customer.addresses.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Addresses</h2>
          <div className={styles.addressGrid}>
            {customer.addresses.map((a) => (
              <div key={a.id} className={styles.addressCard}>
                <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                <p>{a.city}, {a.state} {a.postal_code}</p>
                <p>{a.country}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order history */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Order History ({customer.orders.length})</h2>
        {customer.orders.length === 0 ? (
          <p className={styles.empty}>No orders yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Status</th>
                <th className={styles.right}>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.id}>
                  <td className={styles.bold}>{o.order_number}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[o.status] ?? 'statusDefault']}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className={styles.right}>${(o.total_cents / 100).toFixed(2)}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Admin Notes */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Admin Notes</h2>
        <form onSubmit={handleSaveAdminNotes}>
          <textarea
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            className={styles.textarea}
            rows={4}
            placeholder="Internal notes visible only to admins…"
          />
          {notesMsg && <p style={{ fontSize: '0.85rem', color: '#6ee7b7', marginTop: 4 }}>{notesMsg}</p>}
          <button type="submit" disabled={savingNotes} className={styles.btnPrimary} style={{ marginTop: 8 }}>
            {savingNotes ? 'Saving…' : 'Save Notes'}
          </button>
        </form>
      </div>

      {/* Support notes */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Support Notes</h2>
        <form onSubmit={handleAddNote} className={styles.noteForm}>
          <textarea
            placeholder="Add a note…"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            className={styles.textarea}
            rows={3}
          />
          <button type="submit" disabled={addingNote} className={styles.btnPrimary}>
            {addingNote ? 'Adding…' : 'Add Note'}
          </button>
        </form>
        <div className={styles.noteList}>
          {customer.notes.map((n) => (
            <div key={n.id} className={styles.noteItem}>
              <p className={styles.noteText}>{n.note}</p>
              <span className={styles.noteDate}>{new Date(n.created_at).toLocaleString()}</span>
            </div>
          ))}
          {customer.notes.length === 0 && <p className={styles.empty}>No notes yet.</p>}
        </div>
      </div>
    </div>
  );
}
