import type { Metadata } from "next";
import CollectionClient from "./CollectionClient";

export const metadata: Metadata = {
  title: "Blind Boxes — Noir Crates",
  description:
    "Browse our full collection of mystery blind box figures. Filter by category, sort by price, and discover your next favourite collectible.",
};

export default function BlindBoxesPage() {
  return <CollectionClient />;
}
