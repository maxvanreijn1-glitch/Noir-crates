"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { SORT_OPTIONS } from "@/lib/shopTypes";
import type { FiltersState, NormalizedProduct, StockStatus } from "@/lib/shopTypes";
import {
  filterAndSortProducts,
  getAvailableBrands,
  getAvailableTags,
  getActiveFilterCount,
} from "@/lib/shopUtils";
import ShopHeroBanner from "./ShopHeroBanner";
import HorizontalProductRow from "./HorizontalProductRow";
import CategoryShortcutGrid from "./CategoryShortcutGrid";
import ShopFilters from "./ShopFilters";
import ShopProductCard from "./ShopProductCard";
import styles from "./ShopCollectionClient.module.css";

const ITEMS_PER_PAGE = 8;

const DEFAULT_FILTERS: FiltersState = {
  sort: "featured",
  brands: [],
  tags: [],
  availability: [],
  subcategories: [],
};

const AVAILABILITY_LABELS: Record<StockStatus, string> = {
  in_stock: "In Stock",
  sold_out: "Sold Out",
  preorder: "Pre-order",
};

interface ShopCollectionClientProps {
  initialProducts: NormalizedProduct[];
  title: string;
  description: string;
  breadcrumbLabel: string;
  subcategoryList: string[];
  heroSubtitle?: string;
}

export default function ShopCollectionClient({
  initialProducts,
  title,
  description,
  breadcrumbLabel,
  subcategoryList,
  heroSubtitle,
}: ShopCollectionClientProps) {
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const availableBrands = useMemo(
    () => getAvailableBrands(initialProducts),
    [initialProducts]
  );
  const availableTags = useMemo(
    () => getAvailableTags(initialProducts),
    [initialProducts]
  );

  const trendingProducts = useMemo(
    () =>
      initialProducts
        .filter(
          (p) =>
            p.shopTags.includes("trending") || p.shopTags.includes("hot")
        )
        .slice(0, 12),
    [initialProducts]
  );

  const newProducts = useMemo(
    () =>
      initialProducts
        .filter((p) => p.shopTags.includes("new"))
        .slice(0, 12),
    [initialProducts]
  );

  const filteredProducts = useMemo(
    () => filterAndSortProducts(initialProducts, filters),
    [initialProducts, filters]
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const activeFilterCount = getActiveFilterCount(filters);

  const handleFiltersChange = useCallback((newFilters: FiltersState) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleSubcategorySelect = useCallback(
    (sub: string) => {
      const isSelected = filters.subcategories.includes(sub);
      handleFiltersChange({
        ...filters,
        subcategories: isSelected
          ? filters.subcategories.filter((s) => s !== sub)
          : [sub],
      });
    },
    [filters, handleFiltersChange]
  );

  function removeFilterChip(type: keyof FiltersState, value: string) {
    const updated = { ...filters };
    if (type === "brands") {
      updated.brands = filters.brands.filter((b) => b !== value);
    } else if (type === "tags") {
      updated.tags = filters.tags.filter((t) => t !== value);
    } else if (type === "availability") {
      updated.availability = filters.availability.filter((a) => a !== value);
    } else if (type === "subcategories") {
      updated.subcategories = filters.subcategories.filter((s) => s !== value);
    } else if (type === "sort") {
      updated.sort = "featured";
    }
    handleFiltersChange(updated);
  }

  const selectedSubcategory =
    filters.subcategories.length === 1 ? filters.subcategories[0] : undefined;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">›</span>
          <Link href="/shop">Shop</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{breadcrumbLabel}</span>
        </nav>

        {/* Hero banner */}
        <ShopHeroBanner
          title={title}
          subtitle={heroSubtitle ?? description}
        />

        {/* Trending row */}
        <HorizontalProductRow
          title="Trending Now"
          products={trendingProducts}
        />

        {/* New drops row */}
        <HorizontalProductRow
          title="New Drops"
          products={newProducts}
        />

        {/* Category shortcuts */}
        <CategoryShortcutGrid
          subcategories={subcategoryList}
          selectedSubcategory={selectedSubcategory}
          onSelect={handleSubcategorySelect}
        />

        <hr className={styles.divider} />

        {/* Main layout */}
        <div className={styles.layout}>
          {/* Sidebar (desktop) */}
          <ShopFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableBrands={availableBrands}
            availableTags={availableTags}
            availableSubcategories={subcategoryList}
            resultCount={filteredProducts.length}
            isOpen={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
          />

          {/* Content */}
          <div className={styles.content}>
            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className={styles.chipBar} role="list" aria-label="Active filters">
                {filters.sort !== "featured" && (
                  <span className={styles.chip} role="listitem">
                    Sort: {filters.sort.replace("-", " ")}
                    <button
                      className={styles.chipRemove}
                      onClick={() => removeFilterChip("sort", filters.sort)}
                      aria-label={`Remove sort filter`}
                    >
                      ✕
                    </button>
                  </span>
                )}
                {filters.subcategories.map((sub) => (
                  <span key={sub} className={styles.chip} role="listitem">
                    {sub}
                    <button
                      className={styles.chipRemove}
                      onClick={() => removeFilterChip("subcategories", sub)}
                      aria-label={`Remove ${sub} filter`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {filters.availability.map((a) => (
                  <span key={a} className={styles.chip} role="listitem">
                    {AVAILABILITY_LABELS[a]}
                    <button
                      className={styles.chipRemove}
                      onClick={() => removeFilterChip("availability", a)}
                      aria-label={`Remove ${AVAILABILITY_LABELS[a]} filter`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {filters.brands.map((b) => (
                  <span key={b} className={styles.chip} role="listitem">
                    {b}
                    <button
                      className={styles.chipRemove}
                      onClick={() => removeFilterChip("brands", b)}
                      aria-label={`Remove ${b} filter`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {filters.tags.map((t) => (
                  <span key={t} className={styles.chip} role="listitem">
                    #{t}
                    <button
                      className={styles.chipRemove}
                      onClick={() => removeFilterChip("tags", t)}
                      aria-label={`Remove ${t} tag filter`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <button
                  className={styles.clearChips}
                  onClick={() => handleFiltersChange(DEFAULT_FILTERS)}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Sort bar */}
            <div className={styles.sortBar}>
              <span className={styles.resultCount}>
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </span>
              <div className={styles.sortBarRight}>
                <select
                  className={styles.sortSelect}
                  value={filters.sort}
                  onChange={(e) =>
                    handleFiltersChange({
                      ...filters,
                      sort: e.target.value as FiltersState["sort"],
                    })
                  }
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  className={styles.filterToggle}
                  onClick={() => setFilterDrawerOpen(true)}
                  aria-label={`Open filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`}
                >
                  Filters
                  {activeFilterCount > 0 && (
                    <span className={styles.filterBadge}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Product grid */}
            {paginatedProducts.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyText}>
                  No products match your filters.
                </p>
                <button
                  className={styles.emptyReset}
                  onClick={() => handleFiltersChange(DEFAULT_FILTERS)}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {paginatedProducts.map((product) => (
                  <ShopProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav
                className={styles.pagination}
                aria-label="Product pagination"
              >
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  ‹ Prev
                </button>
                {pageNumbers.map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className={styles.ellipsis}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ""}`}
                      onClick={() => setPage(p as number)}
                      aria-label={`Page ${p}`}
                      aria-current={page === p ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  Next ›
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
