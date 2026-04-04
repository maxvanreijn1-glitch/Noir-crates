"use client";

import { products } from "@/lib/products";
import GenericCollectionClient from "@/components/CollectionClient";

const blindBoxProducts = products.filter((p) => p.category === "Blind Boxes");

export default function CollectionClient() {
  return (
    <GenericCollectionClient
      initialProducts={blindBoxProducts}
      title="Blind Boxes"
      description="Single-figure collectible blind boxes — each box reveals one mystery character from the series. Simple, pure, and surprising."
      breadcrumbLabel="Blind Boxes"
    />
  );
}

