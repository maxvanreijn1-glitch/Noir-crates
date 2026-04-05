import type { Metadata } from "next";
import { Suspense } from "react";
import PokemonPackOpenerClient from "./PokemonPackOpenerClient";

export const metadata: Metadata = {
  title: "Pokémon Pack Opener | Noir Crates",
  description:
    "Open virtual Pokémon TCG booster packs with real card data from TCGdex. Choose from Prismatic Evolutions, Surging Sparks, Stellar Crown, and more.",
};

export default function PokemonPackOpenerPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "#0a0a0f" }} />
      }
    >
      <PokemonPackOpenerClient />
    </Suspense>
  );
}
