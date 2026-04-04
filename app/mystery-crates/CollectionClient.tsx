"use client";

import { products } from "@/lib/products";
import { normalizeProducts } from "@/lib/shopUtils";
import { MYSTERY_SUBCATEGORIES } from "@/lib/shopTypes";
import ShopCollectionClient from "@/components/shop/ShopCollectionClient";

const mysteryProducts = normalizeProducts(
  products.filter((p) => p.category === "Mystery Crates")
);

export default function CollectionClient() {
  return (
    <ShopCollectionClient
      initialProducts={mysteryProducts}
      title="Mystery Crates"
      description="Curated mystery collections — from starter-friendly mini crates to premium multi-figure unboxing experiences. Every box is a moment of discovery."
      breadcrumbLabel="Mystery Crates"
      subcategoryList={MYSTERY_SUBCATEGORIES}
      heroSubtitle="Curated surprises at every tier. From starter crates to high-roller luxury drops."
    />
  );
}
