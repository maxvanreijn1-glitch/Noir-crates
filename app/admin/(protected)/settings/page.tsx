'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

const SETTING_FIELDS: { key: string; label: string; type?: string; placeholder?: string }[] = [
  { key: 'store_name', label: 'Store Name', placeholder: 'Noir Crates' },
  { key: 'store_currency', label: 'Currency', placeholder: 'usd' },
  { key: 'store_tax_rate', label: 'Tax Rate', type: 'number', placeholder: '0.08' },
  { key: 'stripe_publishable_key', label: 'Stripe Publishable Key', placeholder: 'pk_live_...' },
  { key: 'support_email', label: 'Support Email', type: 'email', placeholder: 'support@example.com' },
  { key: 'admin_email_notifications', label: 'Admin Notification Email', type: 'email', placeholder: 'admin@example.com' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setSettings(d);
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  function set(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Save failed'); return; }
      setSettings(data);
      setSuccess('Settings saved successfully.');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading settings…</div>;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.sub}>Configure your store settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        {SETTING_FIELDS.map((f) => (
          <div key={f.key} className={styles.field}>
            <label className={styles.label}>{f.label}</label>
            <input
              type={f.type ?? 'text'}
              value={settings[f.key] ?? ''}
              onChange={(e) => set(f.key, e.target.value)}
              className={styles.input}
              placeholder={f.placeholder}
            />
          </div>
        ))}

        <div className={styles.formActions}>
          <button type="submit" disabled={saving} className={styles.btnPrimary}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
