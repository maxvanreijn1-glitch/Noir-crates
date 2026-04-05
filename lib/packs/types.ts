/**
 * Pack types and associated metadata.
 *
 * Basic   — standard odds, no rarity guarantees
 * Premium — improved odds, guarantees ≥1 Holo or better
 * Elite   — best odds, guarantees ≥1 Ultra-Rare or better AND ≥1 Holo or better
 */

export type PackType = "basic" | "premium" | "elite";

/** Price multiplier applied on top of the set's base price */
export const PACK_TYPE_PRICE_MULTIPLIERS: Record<PackType, number> = {
  basic: 1,
  premium: 1.5,
  elite: 2.5,
};

export const PACK_TYPE_LABELS: Record<PackType, string> = {
  basic: "Basic",
  premium: "Premium",
  elite: "Elite",
};

export const PACK_TYPE_DESCRIPTIONS: Record<PackType, string> = {
  basic: "Standard booster — base odds",
  premium: "Enhanced odds — guaranteed Holo or better",
  elite: "Best odds — guaranteed Ultra Rare + Holo",
};

/**
 * Boost meter value (0–100).
 * Increases with each pack opened; decays on high-rarity pulls.
 * Slightly raises Rare/Holo/Ultra-Rare odds when elevated.
 */
export interface BoostMeter {
  value: number;
  /** Unix ms timestamp of last update (for potential TTL decay) */
  lastUpdated: number;
}

/** Parameters passed to the server-side pack generator */
export interface PackConfig {
  tcgId: string;
  setId: string;
  packType: PackType;
  /** Current boost meter value (0–100), supplied by client from localStorage */
  boostMeter: number;
}

/** What the generator returns to the caller */
export interface PackResult {
  cards: import("@/lib/tcg/index").Card[];
  /** Updated boost meter value the client should persist */
  boostMeterAfter: number;
}
