'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Profile {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  email_verified: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    fetch('/api/account/profile')
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setName(d.name ?? '');
        setPhone(d.phone ?? '');
      });
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || null, phone: phone || null }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error ?? 'Save failed'); return; }
      setProfile(data);
      setMsg('Profile saved.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg('');
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setPwMsg(data.error ?? 'Failed'); return; }
      setPwMsg('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } finally {
      setPwSaving(false);
    }
  }

  if (!profile) return <div className={styles.loading}>Loading…</div>;

  return (
    <div>
      <h1 className={styles.title}>Profile</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Personal Info</h2>
        <form onSubmit={handleSaveProfile} className={styles.form}>
          {msg && <div className={msg.includes('saved') ? styles.success : styles.error}>{msg}</div>}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <div className={styles.staticVal}>
                {profile.email}
                {profile.email_verified ? (
                  <span className={styles.verified}>✓ Verified</span>
                ) : (
                  <span className={styles.unverified}>Unverified</span>
                )}
              </div>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>Name</label>
              <input
                id="name" type="text" value={name}
                onChange={e => setName(e.target.value)}
                className={styles.input} placeholder="Your name"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="phone" className={styles.label}>Phone</label>
              <input
                id="phone" type="tel" value={phone}
                onChange={e => setPhone(e.target.value)}
                className={styles.input} placeholder="+1 555 000 0000"
              />
            </div>
          </div>
          <button type="submit" className={styles.btn} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Change Password</h2>
        <form onSubmit={handleChangePassword} className={styles.form}>
          {pwMsg && <div className={pwMsg.includes('success') ? styles.success : styles.error}>{pwMsg}</div>}
          <div className={styles.field}>
            <label htmlFor="currentPw" className={styles.label}>Current Password</label>
            <input id="currentPw" type="password" value={currentPw}
              onChange={e => setCurrentPw(e.target.value)} className={styles.input} required />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="newPw" className={styles.label}>New Password</label>
              <input id="newPw" type="password" value={newPw}
                onChange={e => setNewPw(e.target.value)} className={styles.input}
                required minLength={8} />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirmPw" className={styles.label}>Confirm New Password</label>
              <input id="confirmPw" type="password" value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)} className={styles.input} required />
            </div>
          </div>
          <button type="submit" className={styles.btn} disabled={pwSaving}>
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
