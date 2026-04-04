"use client";

import { products } from "@/lib/products";
import { normalizeProducts } from "@/lib/shopUtils";
import { BLIND_BOX_SUBCATEGORIES } from "@/lib/shopTypes";
import ShopCollectionClient from "@/components/shop/ShopCollectionClient";

const blindBoxProducts = normalizeProducts(
  products.filter((p) => p.category === "Blind Boxes")
);

export default function CollectionClient() {
  return (
    <ShopCollectionClient
      initialProducts={blindBoxProducts}
      title="Blind Boxes"
      description="Single-figure collectible blind boxes — each box reveals one mystery character from the series. Simple, pure, and surprising."
      breadcrumbLabel="Blind Boxes"
      subcategoryList={BLIND_BOX_SUBCATEGORIES}
      heroSubtitle="Discover your next favourite character. New arrivals weekly."
    />
  );
}

