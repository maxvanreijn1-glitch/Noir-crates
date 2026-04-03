'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface ShippingRate {
  id: number;
  name: string;
  carrier: string | null;
  min_cents: number;
  max_cents: number | null;
  rate_cents: number;
  free_threshold_cents: number | null;
}

interface ShippingZone {
  id: number;
  name: string;
  countries: string[];
  rates: ShippingRate[];
}

export default function ShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Add zone form
  const [zoneName, setZoneName] = useState('');
  const [zoneCountries, setZoneCountries] = useState('');
  const [addingZone, setAddingZone] = useState(false);
  const [zoneError, setZoneError] = useState('');

  // Add rate form state per zone
  const [rateForm, setRateForm] = useState<Record<number, { name: string; carrier: string; rate_cents: string; min_cents: string; free_threshold: string }>>({});

  function load() {
    setLoading(true);
    fetch('/api/admin/shipping')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setZones(d.data ?? []);
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddZone(e: React.FormEvent) {
    e.preventDefault();
    setZoneError('');
    setAddingZone(true);
    try {
      const countries = zoneCountries.split(',').map(c => c.trim()).filter(Boolean);
      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: zoneName, countries }),
      });
      const data = await res.json();
      if (!res.ok) { setZoneError(data.error ?? 'Error'); return; }
      setZoneName('');
      setZoneCountries('');
      load();
    } finally {
      setAddingZone(false);
    }
  }

  async function handleDeleteZone(id: number) {
    if (!confirm('Delete this zone?')) return;
    await fetch(`/api/admin/shipping/${id}`, { method: 'DELETE' });
    load();
  }

  function getRateForm(zoneId: number) {
    return rateForm[zoneId] ?? { name: '', carrier: '', rate_cents: '', min_cents: '0', free_threshold: '' };
  }

  function setRateField(zoneId: number, field: string, value: string) {
    setRateForm((prev) => ({
      ...prev,
      [zoneId]: { ...getRateForm(zoneId), [field]: value },
    }));
  }

  async function handleAddRate(e: React.FormEvent, zoneId: number) {
    e.preventDefault();
    const form = getRateForm(zoneId);
    const res = await fetch(`/api/admin/shipping/${zoneId}/rates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        carrier: form.carrier || null,
        rate_cents: Math.round(parseFloat(form.rate_cents) * 100),
        min_cents: parseInt(form.min_cents) || 0,
        free_threshold_cents: form.free_threshold ? Math.round(parseFloat(form.free_threshold) * 100) : null,
      }),
    });
    if (res.ok) {
      setRateForm((prev) => { const next = { ...prev }; delete next[zoneId]; return next; });
      load();
    }
  }

  async function handleDeleteRate(zoneId: number, rateId: number) {
    if (!confirm('Delete this rate?')) return;
    await fetch(`/api/admin/shipping/${zoneId}/rates/${rateId}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <div className={styles.loading}>Loading shipping zones…</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Shipping</h1>
          <p className={styles.sub}>{zones.length} zones configured</p>
        </div>
      </div>

      {/* Add zone form */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Add Shipping Zone</h2>
        <form onSubmit={handleAddZone} className={styles.addZoneForm}>
          <input
            type="text"
            placeholder="Zone name (e.g. United States)"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="text"
            placeholder="Countries (comma-separated, e.g. US, CA)"
            value={zoneCountries}
            onChange={(e) => setZoneCountries(e.target.value)}
            className={styles.input}
          />
          <button type="submit" disabled={addingZone} className={styles.btnPrimary}>
            {addingZone ? 'Adding…' : 'Add Zone'}
          </button>
          {zoneError && <span className={styles.inlineError}>{zoneError}</span>}
        </form>
      </div>

      {/* Zones list */}
      {zones.length === 0 ? (
        <p className={styles.empty}>No shipping zones yet.</p>
      ) : zones.map((zone) => (
        <div key={zone.id} className={styles.zoneCard}>
          <div className={styles.zoneHeader} onClick={() => toggleExpand(zone.id)}>
            <div>
              <span className={styles.zoneName}>{zone.name}</span>
              {zone.countries.length > 0 && (
                <span className={styles.zoneCountries}>{zone.countries.join(', ')}</span>
              )}
            </div>
            <div className={styles.zoneActions}>
              <span className={styles.rateCount}>{zone.rates.length} rate{zone.rates.length !== 1 ? 's' : ''}</span>
              <span className={styles.expandIcon}>{expanded.has(zone.id) ? '▲' : '▼'}</span>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.id); }} className={styles.deleteBtn}>Delete</button>
            </div>
          </div>

          {expanded.has(zone.id) && (
            <div className={styles.zoneBody}>
              {/* Rates table */}
              {zone.rates.length > 0 && (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Carrier</th>
                      <th className={styles.right}>Rate</th>
                      <th className={styles.right}>Free above</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {zone.rates.map((r) => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>{r.carrier ?? '—'}</td>
                        <td className={styles.right}>${(r.rate_cents / 100).toFixed(2)}</td>
                        <td className={styles.right}>{r.free_threshold_cents ? `$${(r.free_threshold_cents / 100).toFixed(2)}` : '—'}</td>
                        <td>
                          <button onClick={() => handleDeleteRate(zone.id, r.id)} className={styles.deleteBtn}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Add rate form */}
              <form onSubmit={(e) => handleAddRate(e, zone.id)} className={styles.addRateForm}>
                <h3 className={styles.addRateTitle}>Add Rate</h3>
                <div className={styles.rateGrid}>
                  <input
                    type="text"
                    placeholder="Rate name"
                    value={getRateForm(zone.id).name}
                    onChange={(e) => setRateField(zone.id, 'name', e.target.value)}
                    className={styles.input}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Carrier (optional)"
                    value={getRateForm(zone.id).carrier}
                    onChange={(e) => setRateField(zone.id, 'carrier', e.target.value)}
                    className={styles.input}
                  />
                  <input
                    type="number"
                    placeholder="Rate ($)"
                    min="0"
                    step="0.01"
                    value={getRateForm(zone.id).rate_cents}
                    onChange={(e) => setRateField(zone.id, 'rate_cents', e.target.value)}
                    className={styles.input}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Free shipping above ($)"
                    min="0"
                    step="0.01"
                    value={getRateForm(zone.id).free_threshold}
                    onChange={(e) => setRateField(zone.id, 'free_threshold', e.target.value)}
                    className={styles.input}
                  />
                </div>
                <button type="submit" className={styles.btnSecondary}>Add Rate</button>
              </form>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
