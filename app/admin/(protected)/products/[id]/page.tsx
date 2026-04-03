'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

interface ProductForm {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price_cents: string;
  category: string;
  in_stock: boolean;
  stock_qty: string;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  price_cents: '',
  category: '',
  in_stock: true,
  stock_qty: '',
};

export default function ProductEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setForm({
          name: d.name ?? '',
          slug: d.slug ?? '',
          tagline: d.tagline ?? '',
          description: d.description ?? '',
          price_cents: d.price_cents ? String(d.price_cents / 100) : '',
          category: d.category ?? '',
          in_stock: Boolean(d.in_stock),
          stock_qty: d.stock_qty != null ? String(d.stock_qty) : '',
        });
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function set(key: keyof ProductForm, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const priceDollars = parseFloat(form.price_cents);
    if (isNaN(priceDollars) || priceDollars < 0) {
      setError('Enter a valid price');
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      tagline: form.tagline,
      description: form.description,
      price_cents: Math.round(priceDollars * 100),
      category: form.category,
      in_stock: form.in_stock,
      stock_qty: form.stock_qty ? parseInt(form.stock_qty) : null,
    };

    try {
      const res = await fetch(
        isNew ? '/api/admin/products' : `/api/admin/products/${id}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Save failed'); return; }
      setSuccess('Saved successfully!');
      if (isNew) router.push('/admin/products');
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className={styles.loading}>Loading product…</div>;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{isNew ? 'New Product' : 'Edit Product'}</h1>
          <p className={styles.sub}>{isNew ? 'Add a new product to your store' : `Editing product #${id}`}</p>
        </div>
        <button type="button" onClick={() => router.push('/admin/products')} className={styles.backBtn}>
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => {
                set('name', e.target.value);
                if (isNew) set('slug', slugify(e.target.value));
              }}
              className={styles.input}
              placeholder="e.g. Mystery Noir Box"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Slug *</label>
            <input
              type="text"
              required
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              className={styles.input}
              placeholder="e.g. mystery-noir-box"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tagline</label>
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => set('tagline', e.target.value)}
            className={styles.input}
            placeholder="Short marketing line"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className={styles.textarea}
            rows={5}
            placeholder="Full product description…"
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Price (USD) *</label>
            <div className={styles.inputPrefix}>
              <span className={styles.prefix}>$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.price_cents}
                onChange={(e) => set('price_cents', e.target.value)}
                className={styles.inputWithPrefix}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Category *</label>
            <input
              type="text"
              required
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={styles.input}
              placeholder="e.g. mystery-crate"
            />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Stock Qty</label>
            <input
              type="number"
              min="0"
              value={form.stock_qty}
              onChange={(e) => set('stock_qty', e.target.value)}
              className={styles.input}
              placeholder="Leave blank for unlimited"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Availability</label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) => set('in_stock', e.target.checked)}
                className={styles.checkbox}
              />
              In Stock
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" disabled={saving} className={styles.btnPrimary}>
            {saving ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
