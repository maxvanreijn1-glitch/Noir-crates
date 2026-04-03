'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type Tab = 'banners' | 'pages' | 'blog';

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: number;
  sort_order: number;
}

interface CmsPage {
  id: number;
  slug: string;
  title: string;
  is_published: number;
}

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  is_published: number;
  created_at: string;
}

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>('banners');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Banner form
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '' });
  // Page form
  const [pageForm, setPageForm] = useState({ slug: '', title: '', content: '' });
  // Blog form
  const [blogForm, setBlogForm] = useState({ slug: '', title: '', excerpt: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [b, p, bl] = await Promise.all([
        fetch('/api/admin/content/banners').then(r => r.json()),
        fetch('/api/admin/content/pages').then(r => r.json()),
        fetch('/api/admin/content/blog').then(r => r.json()),
      ]);
      if (!b.error) setBanners(b.data ?? []);
      if (!p.error) setPages(p.data ?? []);
      if (!bl.error) setPosts(bl.data ?? []);
    } catch {
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleAddBanner(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: bannerForm.title, subtitle: bannerForm.subtitle || null, image_url: bannerForm.image_url || null, link_url: bannerForm.link_url || null }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Error'); return; }
      setBannerForm({ title: '', subtitle: '', image_url: '', link_url: '' });
      loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPage(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: pageForm.slug, title: pageForm.title, content: pageForm.content || null }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Error'); return; }
      setPageForm({ slug: '', title: '', content: '' });
      loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPost(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/content/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: blogForm.slug, title: blogForm.title, excerpt: blogForm.excerpt || null, content: blogForm.content || null }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Error'); return; }
      setBlogForm({ slug: '', title: '', excerpt: '', content: '' });
      loadAll();
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(type: string, id: number) {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/admin/content/${type}/${id}`, { method: 'DELETE' });
    loadAll();
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Content</h1>
          <p className={styles.sub}>Manage banners, pages, and blog posts</p>
        </div>
      </div>

      <div className={styles.tabs}>
        {(['banners', 'pages', 'blog'] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setFormError(''); }} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Loading…</div>}

      {/* ——— BANNERS ——— */}
      {tab === 'banners' && (
        <div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Add Banner</h2>
            <form onSubmit={handleAddBanner} className={styles.form}>
              {formError && <div className={styles.error}>{formError}</div>}
              <div className={styles.grid2}>
                <input type="text" required placeholder="Title *" value={bannerForm.title} onChange={(e) => setBannerForm(f => ({ ...f, title: e.target.value }))} className={styles.input} />
                <input type="text" placeholder="Subtitle" value={bannerForm.subtitle} onChange={(e) => setBannerForm(f => ({ ...f, subtitle: e.target.value }))} className={styles.input} />
                <input type="text" placeholder="Image URL" value={bannerForm.image_url} onChange={(e) => setBannerForm(f => ({ ...f, image_url: e.target.value }))} className={styles.input} />
                <input type="text" placeholder="Link URL" value={bannerForm.link_url} onChange={(e) => setBannerForm(f => ({ ...f, link_url: e.target.value }))} className={styles.input} />
              </div>
              <button type="submit" disabled={saving} className={styles.btnPrimary}>{saving ? 'Saving…' : 'Add Banner'}</button>
            </form>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Title</th><th>Subtitle</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr><td colSpan={4} className={styles.centered}>No banners.</td></tr>
                ) : banners.map((b) => (
                  <tr key={b.id}>
                    <td className={styles.bold}>{b.title}</td>
                    <td>{b.subtitle ?? '—'}</td>
                    <td><span className={b.is_active ? styles.badgeGreen : styles.badgeGrey}>{b.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><button onClick={() => deleteItem('banners', b.id)} className={styles.deleteBtn}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ——— PAGES ——— */}
      {tab === 'pages' && (
        <div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Add Page</h2>
            <form onSubmit={handleAddPage} className={styles.form}>
              {formError && <div className={styles.error}>{formError}</div>}
              <div className={styles.grid2}>
                <input type="text" required placeholder="Slug * (e.g. about-us)" value={pageForm.slug} onChange={(e) => setPageForm(f => ({ ...f, slug: e.target.value }))} className={styles.input} />
                <input type="text" required placeholder="Title *" value={pageForm.title} onChange={(e) => setPageForm(f => ({ ...f, title: e.target.value }))} className={styles.input} />
              </div>
              <textarea placeholder="Content" value={pageForm.content} onChange={(e) => setPageForm(f => ({ ...f, content: e.target.value }))} className={styles.textarea} rows={4} />
              <button type="submit" disabled={saving} className={styles.btnPrimary}>{saving ? 'Saving…' : 'Add Page'}</button>
            </form>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Slug</th><th>Title</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {pages.length === 0 ? (
                  <tr><td colSpan={4} className={styles.centered}>No pages.</td></tr>
                ) : pages.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.mono}>{p.slug}</td>
                    <td className={styles.bold}>{p.title}</td>
                    <td><span className={p.is_published ? styles.badgeGreen : styles.badgeGrey}>{p.is_published ? 'Published' : 'Draft'}</span></td>
                    <td><button onClick={() => deleteItem('pages', p.id)} className={styles.deleteBtn}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ——— BLOG ——— */}
      {tab === 'blog' && (
        <div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Add Blog Post</h2>
            <form onSubmit={handleAddPost} className={styles.form}>
              {formError && <div className={styles.error}>{formError}</div>}
              <div className={styles.grid2}>
                <input type="text" required placeholder="Slug *" value={blogForm.slug} onChange={(e) => setBlogForm(f => ({ ...f, slug: e.target.value }))} className={styles.input} />
                <input type="text" required placeholder="Title *" value={blogForm.title} onChange={(e) => setBlogForm(f => ({ ...f, title: e.target.value }))} className={styles.input} />
              </div>
              <input type="text" placeholder="Excerpt" value={blogForm.excerpt} onChange={(e) => setBlogForm(f => ({ ...f, excerpt: e.target.value }))} className={styles.input} />
              <textarea placeholder="Content" value={blogForm.content} onChange={(e) => setBlogForm(f => ({ ...f, content: e.target.value }))} className={styles.textarea} rows={4} />
              <button type="submit" disabled={saving} className={styles.btnPrimary}>{saving ? 'Saving…' : 'Add Post'}</button>
            </form>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Slug</th><th>Title</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr><td colSpan={5} className={styles.centered}>No blog posts.</td></tr>
                ) : posts.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.mono}>{p.slug}</td>
                    <td className={styles.bold}>{p.title}</td>
                    <td><span className={p.is_published ? styles.badgeGreen : styles.badgeGrey}>{p.is_published ? 'Published' : 'Draft'}</span></td>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td><button onClick={() => deleteItem('blog', p.id)} className={styles.deleteBtn}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
