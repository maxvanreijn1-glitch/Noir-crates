import { TCG_GAMES, getPackContents, type TcgCard, type RarityOdds } from "@/lib/tcg-data";
import type { Card } from "@/lib/tcg/index";
import { tcgdexProvider } from "@/lib/tcg/tcgdex";
import { generatePack, isCardPoolValid } from "@/lib/packs/generator";
import type { PackConfig, PackResult } from "@/lib/packs/types";

export type { RarityOdds };

export function rollRarity(odds: RarityOdds): string {
  const total = Object.values(odds).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(odds)) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return Object.keys(odds)[0];
}

/** Legacy synchronous builder — used as fallback and by existing routes */
export function buildPackCards(tcgId: string, setId: string): TcgCard[] {
  return getPackContents(tcgId, setId);
}

/**
 * Async pack builder.
 * For Pokémon sets that have a `tcgdexSetId`, fetches real card data from
 * TCGdex (with a 24-hour cache) and uses the new probability generator.
 * Falls back to static data if the API is unavailable or returns too few cards.
 */
export async function buildPackCardsAsync(
  config: PackConfig,
): Promise<PackResult> {
  const { tcgId, setId } = config;

  // Try to load real card data for Pokémon via TCGdex
  if (tcgId === "pokemon") {
    const game = TCG_GAMES.find((g) => g.id === tcgId);
    const set = game?.sets.find((s) => s.id === setId);
    const tcgdexSetId = set?.tcgdexSetId;

    if (tcgdexSetId && set) {
      try {
        const apiCards: Card[] = await tcgdexProvider.fetchCards(
          tcgdexSetId,
          set.name,
        );

        if (isCardPoolValid(apiCards, tcgId)) {
          return generatePack(apiCards, config);
        }
        // Pool too sparse — fall through to static
        console.warn(
          `[pack-opener] TCGdex pool for ${tcgdexSetId} incomplete, using static fallback`,
        );
      } catch (err) {
        console.error("[pack-opener] TCGdex fetch failed, using static fallback:", err);
      }
    }
  }

  // Static fallback — convert TcgCard[] to Card[] (same shape)
  const staticCards: TcgCard[] = getPackContents(tcgId, setId);
  const normalizedStatic: Card[] = staticCards.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image,
    rarity: c.rarity,
    setName: c.setName,
  }));

  // Build the full pool for the set (not just one pack) so the generator can pick
  const game = TCG_GAMES.find((g) => g.id === tcgId);
  const set = game?.sets.find((s) => s.id === setId);
  const fullPool: Card[] = (set?.cards ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image,
    rarity: c.rarity,
    setName: c.setName,
  }));

  if (fullPool.length > 0) {
    return generatePack(fullPool, config);
  }

  // Last resort: return the static pack as-is
  return {
    cards: normalizedStatic,
    boostMeterAfter: config.boostMeter,
  };
}

