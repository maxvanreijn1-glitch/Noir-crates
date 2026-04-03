import type { Metadata } from "next";
import TcgCollectionClient from "./CollectionClient";

export const metadata: Metadata = {
  title: "Trading Card Games — Noir Crates",
  description:
    "Shop booster packs and TCG products for Pokémon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Disney Lorcana, Star Wars: Unlimited, Flesh and Blood, Digimon, and Dragon Ball Super.",
};

export default function TcgPage() {
  return <TcgCollectionClient />;
}
