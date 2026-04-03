import type { Metadata } from "next";
import CollectionClient from "./CollectionClient";

export const metadata: Metadata = {
  title: "Mystery Crates — Noir Crates",
  description:
    "Browse our full collection of mystery crates. Filter by category, sort by price, and discover your next curated unboxing ritual.",
};

export default function MysteryCratesPage() {
  return <CollectionClient />;
}
