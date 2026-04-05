import type { Metadata } from "next";
import { Suspense } from "react";
import PackOpenerClient from "./PackOpenerClient";

export const metadata: Metadata = {
  title: "Pack Opener | Noir Crates",
  description: "Open virtual TCG booster packs — Pokémon, Yu-Gi-Oh!, Magic: The Gathering, One Piece, Dragon Ball Super.",
};

export default function PackOpenerPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0a0f" }} />}>
      <PackOpenerClient />
    </Suspense>
  );
}
