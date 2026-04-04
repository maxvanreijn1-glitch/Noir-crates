'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [error, setError] = useState('');

  // New category form
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const [catSuccess, setCatSuccess] = useState('');
  const [catError, setCatError] = useState('');

  // New subcategory form
  const [subName, setSubName] = useState('');
  const [subSlug, setSubSlug] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [savingSub, setSavingSub] = useState(false);
  const [subSuccess, setSubSuccess] = useState('');
  const [subError, setSubError] = useState('');

  const loadCategories = useCallback(async () => {
    setLoadingCats(true);
    setError('');
    try {
      const r = await fetch('/api/admin/product-categories');
      const d = await r.json();
      if (Array.isArray(d)) setCategories(d);
      else setError(d.error ?? 'Failed to load categories');
    } catch {
      setError('Network error');
    } finally {
      setLoadingCats(false);
    }
  }, []);

  const loadSubcategories = useCallback(async (catId: number) => {
    setLoadingSubs(true);
    try {
      const r = await fetch(`/api/admin/product-categories/${catId}/subcategories`);
      const d = await r.json();
      if (Array.isArray(d)) setSubcategories(d);
      else setSubcategories([]);
    } catch {
      setSubcategories([]);
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  useEffect(() => {
    if (selectedCat) loadSubcategories(selectedCat.id);
    else setSubcategories([]);
  }, [selectedCat, loadSubcategories]);

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setSavingCat(true);
    setCatError('');
    setCatSuccess('');
    try {
      const r = await fetch('/api/admin/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, slug: catSlug, description: catDesc || null }),
      });
      const d = await r.json();
      if (!r.ok) { setCatError(d.error ?? 'Failed'); return; }
      setCatSuccess(`Category "${catName}" created!`);
      setCatName('');
      setCatSlug('');
      setCatDesc('');
      loadCategories();
    } catch {
      setCatError('Network error');
    } finally {
      setSavingCat(false);
    }
  }

  async function handleAddSubcategory(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCat) return;
    setSavingSub(true);
    setSubError('');
    setSubSuccess('');
    try {
      const r = await fetch(`/api/admin/product-categories/${selectedCat.id}/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subName, slug: subSlug, description: subDesc || null }),
      });
      const d = await r.json();
      if (!r.ok) { setSubError(d.error ?? 'Failed'); return; }
      setSubSuccess(`Subcategory "${subName}" created!`);
      setSubName('');
      setSubSlug('');
      setSubDesc('');
      loadSubcategories(selectedCat.id);
    } catch {
      setSubError('Network error');
    } finally {
      setSavingSub(false);
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.sub}>Manage product categories and subcategories</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.columns}>
        {/* Categories column */}
        <div className={styles.column}>
          <h2 className={styles.columnTitle}>Product Categories</h2>

          <form onSubmit={handleAddCategory} className={styles.addForm}>
            <h3 className={styles.formTitle}>Add New Category</h3>
            {catError && <div className={styles.formError}>{catError}</div>}
            {catSuccess && <div className={styles.formSuccess}>{catSuccess}</div>}
            <div className={styles.field}>
              <label className={styles.label}>Name *</label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  setCatSlug(slugify(e.target.value));
                }}
                className={styles.input}
                placeholder="e.g. TCG"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Slug *</label>
              <input
                type="text"
                required
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                className={styles.input}
                placeholder="e.g. tcg"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className={styles.input}
                placeholder="Optional description"
              />
            </div>
            <button type="submit" disabled={savingCat} className={styles.btnPrimary}>
              {savingCat ? 'Adding…' : 'Add Category'}
            </button>
          </form>

          <div className={styles.list}>
            {loadingCats ? (
              <p className={styles.emptyState}>Loading…</p>
            ) : categories.length === 0 ? (
              <p className={styles.emptyState}>No categories yet.</p>
            ) : categories.map((c) => (
              <div
                key={c.id}
                className={`${styles.listItem} ${selectedCat?.id === c.id ? styles.listItemActive : ''}`}
                onClick={() => setSelectedCat(selectedCat?.id === c.id ? null : c)}
              >
                <div className={styles.listItemName}>{c.name}</div>
                <div className={styles.listItemSlug}>{c.slug}</div>
                {c.description && <div className={styles.listItemDesc}>{c.description}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Subcategories column */}
        <div className={styles.column}>
          <h2 className={styles.columnTitle}>
            Subcategories
            {selectedCat && <span className={styles.columnTitleSub}> — {selectedCat.name}</span>}
          </h2>

          {!selectedCat ? (
            <p className={styles.emptyState}>Select a category on the left to manage its subcategories.</p>
          ) : (
            <>
              <form onSubmit={handleAddSubcategory} className={styles.addForm}>
                <h3 className={styles.formTitle}>Add Subcategory to &quot;{selectedCat.name}&quot;</h3>
                {subError && <div className={styles.formError}>{subError}</div>}
                {subSuccess && <div className={styles.formSuccess}>{subSuccess}</div>}
                <div className={styles.field}>
                  <label className={styles.label}>Name *</label>
                  <input
                    type="text"
                    required
                    value={subName}
                    onChange={(e) => {
                      setSubName(e.target.value);
                      setSubSlug(slugify(e.target.value));
                    }}
                    className={styles.input}
                    placeholder="e.g. Pokémon"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Slug *</label>
                  <input
                    type="text"
                    required
                    value={subSlug}
                    onChange={(e) => setSubSlug(e.target.value)}
                    className={styles.input}
                    placeholder="e.g. pokemon"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Description</label>
                  <input
                    type="text"
                    value={subDesc}
                    onChange={(e) => setSubDesc(e.target.value)}
                    className={styles.input}
                    placeholder="Optional description"
                  />
                </div>
                <button type="submit" disabled={savingSub} className={styles.btnPrimary}>
                  {savingSub ? 'Adding…' : 'Add Subcategory'}
                </button>
              </form>

              <div className={styles.list}>
                {loadingSubs ? (
                  <p className={styles.emptyState}>Loading…</p>
                ) : subcategories.length === 0 ? (
                  <p className={styles.emptyState}>No subcategories yet for this category.</p>
                ) : subcategories.map((s) => (
                  <div key={s.id} className={styles.listItem}>
                    <div className={styles.listItemName}>{s.name}</div>
                    <div className={styles.listItemSlug}>{s.slug}</div>
                    {s.description && <div className={styles.listItemDesc}>{s.description}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
