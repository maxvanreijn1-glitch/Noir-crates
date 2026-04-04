"use client";

import styles from "./CategoryShortcutGrid.module.css";

interface CategoryShortcutGridProps {
  subcategories: string[];
  selectedSubcategory?: string;
  onSelect: (sub: string) => void;
}

export default function CategoryShortcutGrid({
  subcategories,
  selectedSubcategory,
  onSelect,
}: CategoryShortcutGridProps) {
  if (subcategories.length === 0) return null;

  return (
    <div className={styles.grid} role="group" aria-label="Filter by subcategory">
      {subcategories.map((sub) => (
        <button
          key={sub}
          className={`${styles.pill} ${selectedSubcategory === sub ? styles.active : ""}`}
          onClick={() => onSelect(sub)}
          aria-pressed={selectedSubcategory === sub}
        >
          {sub}
        </button>
      ))}
    </div>
  );
}
