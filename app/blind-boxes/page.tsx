import type { Metadata } from "next";
import CollectionClient from "./CollectionClient";

export const metadata: Metadata = {
  title: "Blind Boxes — Noir Crates",
  description:
    "Browse our collection of single-figure blind boxes. Each box holds one mystery character from the series — a pure, simple unboxing experience.",
};

export default function BlindBoxesPage() {
  return <CollectionClient />;
}
