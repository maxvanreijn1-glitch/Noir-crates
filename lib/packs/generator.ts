/**
 * Data-driven pack generator.
 *
 * Features:
 *  - Pack-type multipliers (basic / premium / elite) on base rarity odds
 *  - Progressive boost meter (0–100) that slightly raises Rare/Holo/Ultra odds
 *  - Guaranteed minimum rarity slots per pack type (premium → Holo+, elite → Ultra-Rare+)
 *  - Falls back to lower-rarity cards when a rarity pool is empty
 */

import type { Card } from "@/lib/tcg/index";
import type { PackConfig, PackResult, PackType } from "./types";

// ── Rarity tier order (used for comparisons & fallbacks) ─────────────────────
export const RARITY_TIER: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  holo: 3,
  "ultra-rare": 4,
  "secret-rare": 5,
  // Yu-Gi-Oh aliases
  "super-rare": 4,
  "special-rare": 5,
  // MTG alias
  mythic: 4,
};

function tierOf(rarity: string): number {
  return RARITY_TIER[rarity] ?? 0;
}

function isAtLeast(rarity: string, min: string): boolean {
  return tierOf(rarity) >= tierOf(min);
}

// ── Base rarity odds per TCG ──────────────────────────────────────────────────
const BASE_ODDS: Record<string, Record<string, number>> = {
  pokemon: { common: 55, uncommon: 30, rare: 10, holo: 3, "ultra-rare": 2 },
  yugioh: { common: 60, rare: 20, "super-rare": 12, "ultra-rare": 6, "secret-rare": 2 },
  mtg: { common: 50, uncommon: 30, rare: 15, mythic: 5 },
  onepiece: { common: 55, uncommon: 25, rare: 13, "super-rare": 5, "secret-rare": 2 },
  dbs: { common: 55, uncommon: 25, rare: 12, "super-rare": 6, "special-rare": 2 },
};

// ── Pack type odds multipliers ────────────────────────────────────────────────
// Higher-tier packs increase the weight of rarer slots.
const PACK_MULTIPLIERS: Record<PackType, Record<string, number>> = {
  basic: {
    common: 1, uncommon: 1, rare: 1, holo: 1,
    "ultra-rare": 1, "secret-rare": 1, mythic: 1, "super-rare": 1, "special-rare": 1,
  },
  premium: {
    common: 0.7, uncommon: 1.1, rare: 1.6, holo: 2.2,
    "ultra-rare": 1.8, "secret-rare": 1.5, mythic: 1.8, "super-rare": 1.8, "special-rare": 1.5,
  },
  elite: {
    common: 0.4, uncommon: 0.9, rare: 2.2, holo: 3.5,
    "ultra-rare": 3.2, "secret-rare": 2.5, mythic: 3.2, "super-rare": 3.2, "special-rare": 2.5,
  },
};

// ── Pack slots per TCG and pack type ─────────────────────────────────────────
// Each slot specifies a guaranteed minimum rarity and whether the card can
// "roll up" to a higher rarity via the boost-adjusted odds.
type PackSlot = { rarity: string; orBetter?: boolean };

const PACK_SLOTS: Record<string, Record<PackType, PackSlot[]>> = {
  pokemon: {
    basic: [
      ...Array(6).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      { rarity: "rare", orBetter: true },
    ],
    premium: [
      ...Array(5).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      { rarity: "holo", orBetter: true },
      { rarity: "rare", orBetter: true },
    ],
    elite: [
      ...Array(4).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      { rarity: "holo", orBetter: true },
      { rarity: "ultra-rare", orBetter: true },
      { rarity: "rare", orBetter: true },
    ],
  },
  yugioh: {
    basic: [
      ...Array(5).fill({ rarity: "common" }),
      ...Array(2).fill({ rarity: "rare" }),
      { rarity: "super-rare" },
      { rarity: "ultra-rare", orBetter: true },
    ],
    premium: [
      ...Array(4).fill({ rarity: "common" }),
      ...Array(2).fill({ rarity: "rare" }),
      { rarity: "super-rare" },
      { rarity: "ultra-rare" },
      { rarity: "ultra-rare", orBetter: true },
    ],
    elite: [
      ...Array(3).fill({ rarity: "common" }),
      ...Array(2).fill({ rarity: "rare" }),
      { rarity: "super-rare" },
      { rarity: "ultra-rare" },
      { rarity: "ultra-rare" },
      { rarity: "secret-rare", orBetter: true },
    ],
  },
  mtg: {
    basic: [
      ...Array(10).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      { rarity: "rare", orBetter: true },
    ],
    premium: [
      ...Array(9).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      { rarity: "rare", orBetter: true },
      { rarity: "rare", orBetter: true },
    ],
    elite: [
      ...Array(8).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      { rarity: "rare" },
      { rarity: "mythic", orBetter: true },
      { rarity: "rare", orBetter: true },
    ],
  },
  onepiece: {
    basic: [
      ...Array(6).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      ...Array(2).fill({ rarity: "rare" }),
      { rarity: "super-rare", orBetter: true },
    ],
    premium: [
      ...Array(5).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      ...Array(2).fill({ rarity: "rare" }),
      { rarity: "super-rare" },
      { rarity: "super-rare", orBetter: true },
    ],
    elite: [
      ...Array(4).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      ...Array(2).fill({ rarity: "rare" }),
      { rarity: "super-rare" },
      { rarity: "super-rare" },
      { rarity: "secret-rare", orBetter: true },
    ],
  },
  dbs: {
    basic: [
      ...Array(6).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      ...Array(2).fill({ rarity: "rare" }),
      { rarity: "super-rare", orBetter: true },
    ],
    premium: [
      ...Array(5).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      ...Array(2).fill({ rarity: "rare" }),
      { rarity: "super-rare" },
      { rarity: "super-rare", orBetter: true },
    ],
    elite: [
      ...Array(4).fill({ rarity: "common" }),
      ...Array(3).fill({ rarity: "uncommon" }),
      ...Array(2).fill({ rarity: "rare" }),
      { rarity: "super-rare" },
      { rarity: "super-rare" },
      { rarity: "special-rare", orBetter: true },
    ],
  },
};

// ── Upgrade paths for "orBetter" rolls ───────────────────────────────────────
const UPGRADE_PATHS: Record<string, string[]> = {
  pokemon: ["rare", "holo", "ultra-rare", "secret-rare"],
  yugioh: ["rare", "super-rare", "ultra-rare", "secret-rare"],
  mtg: ["rare", "mythic"],
  onepiece: ["rare", "super-rare", "secret-rare"],
  dbs: ["rare", "super-rare", "special-rare"],
};

// ── Odds helpers ──────────────────────────────────────────────────────────────

function computeOdds(
  tcgId: string,
  packType: PackType,
  boostMeter: number,
): Record<string, number> {
  const base = BASE_ODDS[tcgId] ?? BASE_ODDS.pokemon;
  const multipliers = PACK_MULTIPLIERS[packType];

  // Apply pack-type multipliers
  const odds: Record<string, number> = {};
  for (const [rarity, weight] of Object.entries(base)) {
    odds[rarity] = weight * (multipliers[rarity] ?? 1);
  }

  // Apply boost meter: 0–100 maps to 0–50% extra weight on rarer slots
  // Cap so common never drops below 1
  const boostFactor = (Math.min(100, Math.max(0, boostMeter)) / 100) * 0.5;
  const highRarities = ["rare", "holo", "ultra-rare", "secret-rare", "mythic", "super-rare", "special-rare"];
  let totalAdded = 0;
  for (const r of highRarities) {
    if (odds[r] !== undefined) {
      const extra = odds[r] * boostFactor;
      odds[r] += extra;
      totalAdded += extra;
    }
  }
  if (odds.common && totalAdded > 0) {
    odds.common = Math.max(1, odds.common - totalAdded);
  }

  return odds;
}

function weightedRoll(odds: Record<string, number>): string {
  const total = Object.values(odds).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(odds)) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return Object.keys(odds)[0];
}

function rollUpgrade(
  minRarity: string,
  tcgId: string,
  odds: Record<string, number>,
): string {
  const path = UPGRADE_PATHS[tcgId] ?? UPGRADE_PATHS.pokemon;
  const startIdx = path.indexOf(minRarity);
  if (startIdx === -1) return minRarity;

  const subOdds: Record<string, number> = {};
  for (const r of path.slice(startIdx)) {
    if (odds[r] !== undefined) subOdds[r] = odds[r];
  }
  if (Object.keys(subOdds).length === 0) return minRarity;
  return weightedRoll(subOdds);
}

function pickCard(cards: Card[], rarity: string): Card {
  let pool = cards.filter((c) => c.rarity === rarity);

  // Fallback: walk down rarity tiers until we find cards
  if (pool.length === 0) {
    const sorted = Object.keys(RARITY_TIER).sort(
      (a, b) => tierOf(b) - tierOf(a),
    );
    for (const r of sorted) {
      pool = cards.filter((c) => c.rarity === r);
      if (pool.length > 0) break;
    }
  }

  if (pool.length === 0) return cards[Math.floor(Math.random() * cards.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Boost meter update ────────────────────────────────────────────────────────

function updateBoostMeter(
  current: number,
  packType: PackType,
  pulledRarities: string[],
): number {
  const increments: Record<PackType, number> = { basic: 5, premium: 10, elite: 15 };
  let next = current + increments[packType];

  // Decay on high-rarity pulls (strongest pull wins)
  const maxTier = Math.max(...pulledRarities.map(tierOf));
  if (maxTier >= 5) {
    next = 0; // Reset on secret-rare / special-rare
  } else if (maxTier >= 4) {
    next *= 0.5; // Halve on ultra-rare / mythic
  } else if (maxTier >= 3) {
    next *= 0.75; // Reduce by 25% on holo
  }

  return Math.min(100, Math.max(0, Math.round(next)));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a pack of cards using dynamic rarity odds and the progressive boost.
 *
 * @param cards   - Full card pool for the set (from static data or API)
 * @param config  - tcgId, setId, packType, boostMeter
 */
export function generatePack(cards: Card[], config: PackConfig): PackResult {
  const { tcgId, packType, boostMeter } = config;

  const odds = computeOdds(tcgId, packType, boostMeter);
  const slots = (PACK_SLOTS[tcgId] ?? PACK_SLOTS.pokemon)[packType];

  const result: Card[] = [];
  for (const slot of slots) {
    const rarity = slot.orBetter
      ? rollUpgrade(slot.rarity, tcgId, odds)
      : slot.rarity;
    result.push(pickCard(cards, rarity));
  }

  const boostMeterAfter = updateBoostMeter(
    boostMeter,
    packType,
    result.map((c) => c.rarity),
  );

  return { cards: result, boostMeterAfter };
}

/**
 * Check whether a card pool is usable (has at least one card per key rarity).
 * Used to decide whether to fall back to static data.
 */
export function isCardPoolValid(cards: Card[], tcgId: string): boolean {
  const base = BASE_ODDS[tcgId] ?? BASE_ODDS.pokemon;
  for (const rarity of Object.keys(base)) {
    if (!cards.some((c) => c.rarity === rarity)) {
      // Missing at least one key rarity — pool may be incomplete
      // (Allow missing secret-rare / ultra-rare since they're genuinely sparse)
      if (tierOf(rarity) < 4) return false;
    }
  }
  return cards.length >= 5;
}
