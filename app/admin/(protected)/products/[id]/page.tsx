'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

interface ProductSubcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
}

interface AttributePair {
  key: string;
  value: string;
}

interface ProductForm {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price_cents: string;
  category: string;
  category_id: string;
  subcategory_id: string;
  in_stock: boolean;
  stock_qty: string;
  images: string[];
  attributes: AttributePair[];
  featured: boolean;
  status: string;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  price_cents: '',
  category: '',
  category_id: '',
  subcategory_id: '',
  in_stock: true,
  stock_qty: '',
  images: [],
  attributes: [],
  featured: false,
  status: 'active',
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

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ProductSubcategory[]>([]);
  const [imageInput, setImageInput] = useState('');

  // Load categories
  useEffect(() => {
    fetch('/api/admin/product-categories')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCategories(d); })
      .catch(() => {});
  }, []);

  // Load subcategories when category changes
  const loadSubcategories = useCallback(async (catId: string) => {
    if (!catId) { setSubcategories([]); return; }
    try {
      const r = await fetch(`/api/admin/product-categories/${catId}/subcategories`);
      const d = await r.json();
      if (Array.isArray(d)) setSubcategories(d);
    } catch { setSubcategories([]); }
  }, []);

  useEffect(() => {
    loadSubcategories(form.category_id);
  }, [form.category_id, loadSubcategories]);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        const rawAttrs = d.attributes && typeof d.attributes === 'object' && !Array.isArray(d.attributes)
          ? Object.entries(d.attributes as Record<string, string>).map(([k, v]) => ({ key: k, value: String(v) }))
          : [];
        setForm({
          name: d.name ?? '',
          slug: d.slug ?? '',
          tagline: d.tagline ?? '',
          description: d.description ?? '',
          price_cents: d.price_cents ? String(d.price_cents / 100) : '',
          category: d.category ?? '',
          category_id: d.category_id ? String(d.category_id) : '',
          subcategory_id: d.subcategory_id ? String(d.subcategory_id) : '',
          in_stock: Boolean(d.in_stock),
          stock_qty: d.stock_qty != null ? String(d.stock_qty) : '',
          images: Array.isArray(d.images) ? d.images : [],
          attributes: rawAttrs,
          featured: Boolean(d.featured),
          status: d.status ?? 'active',
        });
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function set<K extends keyof ProductForm>(key: K, value: ProductForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function addImage() {
    const url = imageInput.trim();
    if (!url) return;
    set('images', [...form.images, url]);
    setImageInput('');
  }

  function removeImage(idx: number) {
    set('images', form.images.filter((_, i) => i !== idx));
  }

  function addAttribute() {
    set('attributes', [...form.attributes, { key: '', value: '' }]);
  }

  function updateAttribute(idx: number, field: 'key' | 'value', val: string) {
    const updated = form.attributes.map((a, i) => i === idx ? { ...a, [field]: val } : a);
    set('attributes', updated);
  }

  function removeAttribute(idx: number) {
    set('attributes', form.attributes.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const priceDollars = parseFloat(form.price_cents);
    if (isNaN(priceDollars) || priceDollars <= 0) {
      setError('Price must be greater than $0.00');
      setSaving(false);
      return;
    }

    const stockQty = form.stock_qty ? parseInt(form.stock_qty) : 0;
    if (stockQty < 0) {
      setError('Stock quantity must be 0 or more');
      setSaving(false);
      return;
    }

    // Build attributes object from pairs
    const attributesObj: Record<string, string> = {};
    for (const pair of form.attributes) {
      if (pair.key.trim()) attributesObj[pair.key.trim()] = pair.value;
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      tagline: form.tagline,
      description: form.description,
      price_cents: Math.round(priceDollars * 100),
      category: form.category,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      subcategory_id: form.subcategory_id ? parseInt(form.subcategory_id) : null,
      in_stock: form.in_stock,
      stock_qty: stockQty,
      images: form.images,
      attributes: attributesObj,
      featured: form.featured,
      status: form.status,
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
                min="0.01"
                step="0.01"
                value={form.price_cents}
                onChange={(e) => set('price_cents', e.target.value)}
                className={styles.inputWithPrefix}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Stock Qty</label>
            <input
              type="number"
              min="0"
              value={form.stock_qty}
              onChange={(e) => set('stock_qty', e.target.value)}
              className={styles.input}
              placeholder="0"
            />
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select
              value={form.category_id}
              onChange={(e) => {
                const catId = e.target.value;
                const cat = categories.find((c) => String(c.id) === catId);
                set('category_id', catId);
                set('category', cat ? cat.slug : '');
                set('subcategory_id', '');
              }}
              className={styles.input}
            >
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Subcategory</label>
            <select
              value={form.subcategory_id}
              onChange={(e) => set('subcategory_id', e.target.value)}
              className={styles.input}
              disabled={!form.category_id || subcategories.length === 0}
            >
              <option value="">— Select subcategory —</option>
              {subcategories.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className={styles.input}
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Availability &amp; Featured</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.in_stock}
                  onChange={(e) => set('in_stock', e.target.checked)}
                  className={styles.checkbox}
                />
                In Stock
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set('featured', e.target.checked)}
                  className={styles.checkbox}
                />
                Featured Product
              </label>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className={styles.field}>
          <label className={styles.label}>Product Images</label>
          <div className={styles.imageInputRow}>
            <input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
              className={styles.input}
              placeholder="Paste image URL and press Add"
            />
            <button type="button" onClick={addImage} className={styles.btnSecondary}>
              Add
            </button>
          </div>
          {form.images.length > 0 && (
            <div className={styles.imageGrid}>
              {form.images.map((url, i) => (
                <div key={i} className={styles.imageItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Product image ${i + 1}`} className={styles.imagePreview} />
                  <button type="button" onClick={() => removeImage(i)} className={styles.imageRemoveBtn}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attributes */}
        <div className={styles.field}>
          <label className={styles.label}>Custom Attributes</label>
          {form.attributes.map((attr, i) => (
            <div key={i} className={styles.attrRow}>
              <input
                type="text"
                value={attr.key}
                onChange={(e) => updateAttribute(i, 'key', e.target.value)}
                className={styles.attrInput}
                placeholder="Key (e.g. brand)"
              />
              <input
                type="text"
                value={attr.value}
                onChange={(e) => updateAttribute(i, 'value', e.target.value)}
                className={styles.attrInput}
                placeholder="Value (e.g. Pokémon)"
              />
              <button type="button" onClick={() => removeAttribute(i)} className={styles.attrRemoveBtn}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addAttribute} className={styles.btnSecondary} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
            + Add Attribute
          </button>
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

