"use client";

import { products } from "@/lib/products";
import GenericCollectionClient from "@/components/CollectionClient";

const MYSTERY_CATEGORIES = new Set([
  "Mystery Box",
  "Series",
  "Limited Edition",
  "Premium",
]);

const mysteryProducts = products.filter((p) =>
  MYSTERY_CATEGORIES.has(p.category)
);

export default function CollectionClient() {
  return (
    <GenericCollectionClient
      initialProducts={mysteryProducts}
      title="Mystery Crates"
      description="Curated mystery collections — from starter-friendly mini crates to premium multi-figure unboxing experiences. Every box is a moment of discovery."
      breadcrumbLabel="Mystery Crates"
    />
  );
}
