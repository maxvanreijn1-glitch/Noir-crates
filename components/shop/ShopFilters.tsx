"use client";

import type { FiltersState, StockStatus } from "@/lib/shopTypes";
import { SORT_OPTIONS } from "@/lib/shopTypes";
import { getActiveFilterCount } from "@/lib/shopUtils";
import styles from "./ShopFilters.module.css";

const AVAILABILITY_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "In Stock" },
  { value: "sold_out", label: "Sold Out" },
  { value: "preorder", label: "Pre-order" },
];

const TAG_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "new", label: "New" },
  { value: "limited", label: "Limited" },
  { value: "kawaii", label: "Kawaii" },
  { value: "premium", label: "Premium" },
  { value: "hot", label: "Hot" },
  { value: "anime", label: "Anime" },
];

interface ShopFiltersProps {
  filters: FiltersState;
  onFiltersChange: (f: FiltersState) => void;
  availableBrands: string[];
  availableTags: string[];
  availableSubcategories: string[];
  resultCount: number;
  isOpen: boolean;
  onClose: () => void;
}

interface FilterContentProps {
  filters: FiltersState;
  onFiltersChange: (f: FiltersState) => void;
  availableBrands: string[];
  availableSubcategories: string[];
}

function FilterContent({
  filters,
  onFiltersChange,
  availableBrands,
  availableSubcategories,
}: FilterContentProps) {
  const activeCount = getActiveFilterCount(filters);

  function toggleArrayItem<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    onFiltersChange({
      ...filters,
      sort: e.target.value as FiltersState["sort"],
    });
  }

  function toggleSubcategory(sub: string) {
    onFiltersChange({
      ...filters,
      subcategories: toggleArrayItem(filters.subcategories, sub),
    });
  }

  function toggleAvailability(val: StockStatus) {
    onFiltersChange({
      ...filters,
      availability: toggleArrayItem(filters.availability, val),
    });
  }

  function toggleBrand(brand: string) {
    onFiltersChange({
      ...filters,
      brands: toggleArrayItem(filters.brands, brand),
    });
  }

  function toggleTag(tag: string) {
    onFiltersChange({
      ...filters,
      tags: toggleArrayItem(filters.tags, tag),
    });
  }

  function clearAll() {
    onFiltersChange({
      sort: "featured",
      brands: [],
      tags: [],
      availability: [],
      subcategories: [],
    });
  }

  return (
    <div className={styles.filterContent}>
      {activeCount > 0 && (
        <button className={styles.clearAll} onClick={clearAll}>
          Clear all filters ({activeCount})
        </button>
      )}

      {/* Sort */}
      <div className={styles.section}>
        <h3 className={styles.sectionHeading}>Sort By</h3>
        <select
          className={styles.sortSelect}
          value={filters.sort}
          onChange={handleSort}
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategories */}
      {availableSubcategories.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Category</h3>
          {availableSubcategories.map((sub) => (
            <label key={sub} className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={filters.subcategories.includes(sub)}
                onChange={() => toggleSubcategory(sub)}
                className={styles.checkbox}
              />
              <span>{sub}</span>
            </label>
          ))}
        </div>
      )}

      {/* Availability */}
      <div className={styles.section}>
        <h3 className={styles.sectionHeading}>Availability</h3>
        {AVAILABILITY_OPTIONS.map((opt) => (
          <label key={opt.value} className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={filters.availability.includes(opt.value)}
              onChange={() => toggleAvailability(opt.value)}
              className={styles.checkbox}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Brand / Series */}
      {availableBrands.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionHeading}>Brand / Series</h3>
          <div className={styles.brandList}>
            {availableBrands.map((brand) => (
              <label key={brand} className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={filters.brands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className={styles.checkbox}
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className={styles.section}>
        <h3 className={styles.sectionHeading}>Tags</h3>
        <div className={styles.tagGrid}>
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag.value}
              className={`${styles.tagPill} ${filters.tags.includes(tag.value) ? styles.tagPillActive : ""}`}
              onClick={() => toggleTag(tag.value)}
              aria-pressed={filters.tags.includes(tag.value)}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ShopFilters({
  filters,
  onFiltersChange,
  availableBrands,
  availableTags: _availableTags,
  availableSubcategories,
  resultCount,
  isOpen,
  onClose,
}: ShopFiltersProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <FilterContent
          filters={filters}
          onFiltersChange={onFiltersChange}
          availableBrands={availableBrands}
          availableSubcategories={availableSubcategories}
        />
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      )}
      <div
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Filters</span>
          <button
            className={styles.drawerClose}
            onClick={onClose}
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>
        <div className={styles.drawerBody}>
          <FilterContent
            filters={filters}
            onFiltersChange={onFiltersChange}
            availableBrands={availableBrands}
            availableSubcategories={availableSubcategories}
          />
        </div>
        <div className={styles.drawerFooter}>
          <button className={styles.applyBtn} onClick={onClose}>
            View {resultCount} result{resultCount !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </>
  );
}
