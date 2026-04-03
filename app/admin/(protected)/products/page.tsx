'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Product {
  id: number;
  name: string;
  slug: string;
  category: string;
  price_cents: number;
  stock_qty: number;
  in_stock: number;
}

interface PaginatedResponse {
  data: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/products?${params}`);
      const data: PaginatedResponse = await res.json();
      if (!res.ok) { setError((data as { error?: string }).error ?? 'Error'); return; }
      setProducts(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    load();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.sub}>{total} total products</p>
        </div>
        <Link href="/admin/products/new" className={styles.btnPrimary}>+ Add Product</Link>
      </div>

      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="search"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.btnSecondary}>Search</button>
        </form>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.centered}>Loading…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className={styles.centered}>No products found.</td></tr>
            ) : products.map((p) => (
              <tr key={p.id}>
                <td className={styles.bold}>{p.name}</td>
                <td>{p.category}</td>
                <td>${(p.price_cents / 100).toFixed(2)}</td>
                <td>{p.stock_qty ?? '—'}</td>
                <td>
                  <span className={p.in_stock ? styles.badgeGreen : styles.badgeRed}>
                    {p.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <Link href={`/admin/products/${p.id}`} className={styles.linkBtn}>Edit</Link>
                  <button onClick={() => handleDelete(p.id)} className={styles.deleteBtn}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={styles.pageBtn}>
            ← Prev
          </button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={styles.pageBtn}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
