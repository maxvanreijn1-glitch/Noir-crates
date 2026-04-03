"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Product } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import styles from "./CollectionClient.module.css";

const ITEMS_PER_PAGE = 6;

type SortOption =
  | "featured"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "newest";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
  { value: "name-desc", label: "Name: Z–A" },
  { value: "newest", label: "Newest" },
];

function sortProducts(items: Product[], sort: SortOption): Product[] {
  const arr = [...items];
  switch (sort) {
    case "price-asc":
      return arr.sort((a, b) => a.price - b.price);
    case "price-desc":
      return arr.sort((a, b) => b.price - a.price);
    case "name-asc":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return arr.sort((a, b) => b.name.localeCompare(a.name));
    case "newest":
      return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    default:
      return arr;
  }
}

interface FilterPanelProps {
  categories: string[];
  selectedCategories: string[];
  showInStockOnly: boolean;
  onToggleCategory: (cat: string) => void;
  onToggleInStock: (val: boolean) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  categoryLabel: string;
}

function FilterPanel({
  categories,
  selectedCategories,
  showInStockOnly,
  onToggleCategory,
  onToggleInStock,
  onClearAll,
  hasActiveFilters,
  categoryLabel,
}: FilterPanelProps) {
  return (
    <div className={styles.filterPanel}>
      {hasActiveFilters && (
        <button className={styles.clearAll} onClick={onClearAll}>
          Clear all filters
        </button>
      )}

      <div className={styles.filterSection}>
        <h3 className={styles.filterHeading}>Availability</h3>
        <label className={styles.filterCheck}>
          <input
            type="checkbox"
            checked={showInStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
          />
          <span>In stock only</span>
        </label>
      </div>

      {categories.length > 1 && (
        <div className={styles.filterSection}>
          <h3 className={styles.filterHeading}>{categoryLabel}</h3>
          {categories.map((cat) => (
            <label key={cat} className={styles.filterCheck}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => onToggleCategory(cat)}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export interface CollectionClientProps {
  initialProducts: Product[];
  title: string;
  description: string;
  breadcrumbLabel: string;
  /** Label for the category filter heading. Defaults to "Category". */
  categoryLabel?: string;
}

export default function CollectionClient({
  initialProducts,
  title,
  description,
  breadcrumbLabel,
  categoryLabel = "Category",
}: CollectionClientProps) {
  const [sort, setSort] = useState<SortOption>("featured");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const filterToggleRef = useRef<HTMLButtonElement>(null);

  const allCategories = useMemo(
    () =>
      Array.from(new Set(initialProducts.map((p) => p.category))).sort(),
    [initialProducts]
  );

  const hasActiveFilters = selectedCategories.length > 0 || showInStockOnly;
  const activeFilterCount =
    selectedCategories.length + (showInStockOnly ? 1 : 0);

  // Focus trap and keyboard close for mobile filter drawer
  useEffect(() => {
    if (!filterOpen) return;
    const el = drawerRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFilterOpen(false);
        filterToggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [filterOpen]);

  const filtered = useMemo(() => {
    let result = initialProducts;
    if (showInStockOnly) result = result.filter((p) => p.inStock);
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }
    return sortProducts(result, sort);
  }, [initialProducts, sort, selectedCategories, showInStockOnly]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setPage(1);
  }, []);

  const toggleInStock = useCallback((val: boolean) => {
    setShowInStockOnly(val);
    setPage(1);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setShowInStockOnly(false);
    setPage(1);
  }, []);

  function handleSort(val: SortOption) {
    setSort(val);
    setPage(1);
  }

  function closeDrawer() {
    setFilterOpen(false);
    filterToggleRef.current?.focus();
  }

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{breadcrumbLabel}</span>
        </nav>

        {/* Collection header */}
        <header className={styles.collectionHeader}>
          <h1 className={styles.collectionTitle}>{title}</h1>
          <p className={styles.collectionDesc}>{description}</p>
        </header>

        {/* Main layout: sidebar + content */}
        <div className={styles.layout}>
          {/* Desktop filter sidebar */}
          <aside className={styles.sidebar} aria-label="Product filters">
            <FilterPanel
              categories={allCategories}
              selectedCategories={selectedCategories}
              showInStockOnly={showInStockOnly}
              onToggleCategory={toggleCategory}
              onToggleInStock={toggleInStock}
              onClearAll={clearAllFilters}
              hasActiveFilters={hasActiveFilters}
              categoryLabel={categoryLabel}
            />
          </aside>

          {/* Product content area */}
          <div className={styles.content}>
            {/* Sort bar */}
            <div className={styles.sortBar}>
              <p className={styles.resultCount}>
                {filtered.length}{" "}
                {filtered.length === 1 ? "product" : "products"}
              </p>
              <div className={styles.sortRight}>
                <label htmlFor="sort-select" className={styles.sortLabel}>
                  Sort by
                </label>
                <select
                  id="sort-select"
                  className={styles.sortSelect}
                  value={sort}
                  onChange={(e) => handleSort(e.target.value as SortOption)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                {/* Mobile filter toggle */}
                <button
                  ref={filterToggleRef}
                  className={styles.filterToggle}
                  onClick={() => setFilterOpen(true)}
                  aria-expanded={filterOpen}
                  aria-controls="filter-drawer"
                  aria-label="Open filters"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                    <line x1="11" y1="18" x2="13" y2="18" />
                  </svg>
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span
                      className={styles.filterBadge}
                      aria-label={`${activeFilterCount} active filters`}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Product grid */}
            {paginated.length === 0 ? (
              <div className={styles.empty}>
                <p>No products match your current filters.</p>
                <button className={styles.emptyReset} onClick={clearAllFilters}>
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {paginated.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Page navigation">
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      className={`${styles.pageBtn} ${
                        n === page ? styles.pageBtnActive : ""
                      }`}
                      onClick={() => setPage(n)}
                      aria-label={`Page ${n}`}
                      aria-current={n === page ? "page" : undefined}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  ›
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer overlay */}
      {filterOpen && (
        <div
          className={styles.drawerOverlay}
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Mobile filter drawer */}
      <div
        id="filter-drawer"
        ref={drawerRef}
        className={`${styles.filterDrawer} ${
          filterOpen ? styles.filterDrawerOpen : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        aria-hidden={!filterOpen}
      >
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Filters</h2>
          <button
            className={styles.drawerClose}
            onClick={closeDrawer}
            aria-label="Close filters"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.drawerBody}>
          <FilterPanel
            categories={allCategories}
            selectedCategories={selectedCategories}
            showInStockOnly={showInStockOnly}
            onToggleCategory={toggleCategory}
            onToggleInStock={toggleInStock}
            onClearAll={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            categoryLabel={categoryLabel}
          />
        </div>

        <div className={styles.drawerFooter}>
          <button className={styles.drawerApply} onClick={closeDrawer}>
            View {filtered.length}{" "}
            {filtered.length === 1 ? "product" : "products"}
          </button>
        </div>
      </div>
    </div>
  );
}
