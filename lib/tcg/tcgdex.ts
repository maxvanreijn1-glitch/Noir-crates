/**
 * TCGdex provider — fetches real Pokémon card data from https://api.tcgdex.net
 * No API key required. Responses are cached for 24 hours via Next.js fetch cache.
 *
 * Rarity normalization mapping (Scarlet & Violet era → internal keys):
 *   Common                    → "common"
 *   Uncommon                  → "uncommon"
 *   Rare / Double Rare        → "rare"
 *   Illustration Rare         → "holo"
 *   Shiny Rare / Leader's Rare→ "holo"
 *   Special Illustration Rare → "ultra-rare"
 *   Hyper Rare / ACE SPEC Rare→ "ultra-rare"
 *   Shiny Ultra Rare          → "ultra-rare"
 *   *Secret*                  → "secret-rare"
 */

import type { Card, TcgProvider } from "./index";

interface TcgdexCard {
  id: string;
  localId?: string;
  name: string;
  image?: string;
  rarity?: string;
}

interface TcgdexSetResponse {
  id: string;
  name: string;
  cards?: TcgdexCard[];
}

function normalizeRarity(raw: string | undefined): string {
  if (!raw) return "common";
  const r = raw.toLowerCase().trim();

  if (r.includes("secret")) return "secret-rare";
  if (
    r === "hyper rare" ||
    r === "special illustration rare" ||
    r === "ace spec rare" ||
    r === "shiny ultra rare"
  )
    return "ultra-rare";
  if (
    r === "illustration rare" ||
    r === "shiny rare" ||
    r === "leader's rare"
  )
    return "holo";
  if (r === "double rare") return "rare";
  if (r === "rare") return "rare";
  if (r === "uncommon") return "uncommon";
  return "common";
}

export const tcgdexProvider: TcgProvider = {
  async fetchCards(tcgdexSetId: string, setName: string): Promise<Card[]> {
    const res = await fetch(
      `https://api.tcgdex.net/v2/en/sets/${tcgdexSetId}`,
      {
        // Cache for 24 hours; revalidates automatically in the background
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) {
      throw new Error(
        `TCGdex API error ${res.status} for set "${tcgdexSetId}"`
      );
    }

    const data = (await res.json()) as TcgdexSetResponse;

    return (data.cards ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      // TCGdex image base URL + quality suffix for the highest resolution
      image: c.image ? `${c.image}/high.webp` : "",
      rarity: normalizeRarity(c.rarity),
      setName,
    }));
  },
};
