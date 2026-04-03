"use client";

import { products } from "@/lib/products";
import GenericCollectionClient from "@/components/CollectionClient";

const TCG_GAMES = [
  "Pokémon Trading Card Game",
  "Magic: The Gathering",
  "Yu-Gi-Oh! Trading Card Game",
  "One Piece Card Game",
  "Disney Lorcana",
  "Star Wars: Unlimited",
  "Flesh and Blood",
  "Digimon Card Game",
  "Dragon Ball Super Card Game",
];

const tcgProducts = products.filter((p) => TCG_GAMES.includes(p.category));

export default function TcgCollectionClient() {
  return (
    <GenericCollectionClient
      initialProducts={tcgProducts}
      title="Trading Card Games"
      description="Booster packs and sets for all the major TCGs. Filter by game or browse the full range — Pokémon, Magic, Yu-Gi-Oh!, One Piece, Lorcana, and more."
      breadcrumbLabel="TCG"
      categoryLabel="Game"
    />
  );
}
