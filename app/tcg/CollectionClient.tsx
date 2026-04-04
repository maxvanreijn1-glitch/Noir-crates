"use client";

import { products } from "@/lib/products";
import { normalizeProducts } from "@/lib/shopUtils";
import { TCG_SUBCATEGORIES } from "@/lib/shopTypes";
import ShopCollectionClient from "@/components/shop/ShopCollectionClient";

const tcgProducts = normalizeProducts(
  products.filter((p) => p.category === "TCG")
);

export default function TcgCollectionClient() {
  return (
    <ShopCollectionClient
      initialProducts={tcgProducts}
      title="Trading Card Games"
      description="Booster packs and sets for all the major TCGs — Pokémon, Yu-Gi-Oh!, One Piece, Lorcana, and more."
      breadcrumbLabel="TCG"
      subcategoryList={TCG_SUBCATEGORIES}
      heroSubtitle="Build your collection. Chase the rarest pulls. New sets arriving regularly."
    />
  );
}
