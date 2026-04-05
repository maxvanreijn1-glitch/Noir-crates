import { getPackContents, type TcgCard, type RarityOdds } from "@/lib/tcg-data";

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

export function buildPackCards(tcgId: string, setId: string): TcgCard[] {
  return getPackContents(tcgId, setId);
}
