/**
 * TCGdex API integration for the Pokémon TCG pack-opening system.
 *
 * Data source : https://api.tcgdex.net/v2/en
 * Image CDN   : https://assets.tcgdex.net
 *
 * Caching strategy:
 *   Server-side in-memory Map keyed by TCGdex set ID with a 1-hour TTL.
 *   Next.js fetch cache (revalidate: 3600) provides an additional HTTP layer.
 */

// ─── Public types ────────────────────────────────────────────────────────────

export interface TcgdexCard {
  id: string;
  name: string;
  /** Full high-quality image URL from the TCGdex CDN */
  image: string;
  /** Normalized rarity: "common" | "uncommon" | "rare" | "ultra" */
  rarity: string;
  setName: string;
}

export interface PokemonSet {
  /** Display name shown in the UI */
  name: string;
  /** TCGdex set ID (e.g. "sv8pt5") */
  tcgdexId: string;
  /** Release year */
  releaseYear: number;
}

// ─── Canonical set list ──────────────────────────────────────────────────────

/**
 * Supported Pokémon sets mapped to their TCGdex set IDs.
 * Order matches the UI picker (newest → oldest).
 */
export const POKEMON_SETS: PokemonSet[] = [
  { name: "Prismatic Evolutions",  tcgdexId: "sv8pt5",    releaseYear: 2025 },
  { name: "Surging Sparks",        tcgdexId: "sv8",       releaseYear: 2024 },
  { name: "Stellar Crown",         tcgdexId: "sv7",       releaseYear: 2024 },
  { name: "Twilight Masquerade",   tcgdexId: "sv6",       releaseYear: 2024 },
  { name: "Temporal Forces",       tcgdexId: "sv5",       releaseYear: 2024 },
  { name: "Paldean Fates",         tcgdexId: "sv4pt5",    releaseYear: 2024 },
  { name: "Paradox Rift",          tcgdexId: "sv4",       releaseYear: 2023 },
  { name: "Obsidian Flames",       tcgdexId: "sv3",       releaseYear: 2023 },
  { name: "Scarlet & Violet Base", tcgdexId: "sv1",       releaseYear: 2023 },
  { name: "Crown Zenith",          tcgdexId: "swsh12pt5", releaseYear: 2023 },
];

// ─── Rarity normalisation ─────────────────────────────────────────────────────

/**
 * Map raw TCGdex rarity strings (case-insensitive, trimmed) into four
 * canonical tiers used by the pack-odds logic:
 *   "common" | "uncommon" | "rare" | "ultra"
 *
 * Secret Rare is treated as ultra.
 * Unknown / missing values default to "common".
 */
export function normalizeRarity(raw: string | null | undefined): string {
  if (!raw) return "common";
  const r = raw.trim().toLowerCase();

  // ── Ultra / Secret tier ──────────────────────────────────────────────────
  if (
    r.includes("hyper") ||
    r.includes("secret") ||
    r.includes("rainbow") ||
    r.includes("gold") ||
    r.includes("special illustration") ||
    r.includes("ultra rare") ||
    r.includes("full art") ||
    r.includes("trainer gallery")
  ) {
    return "ultra";
  }

  // ── Rare tier ────────────────────────────────────────────────────────────
  if (
    r.includes("illustration rare") ||
    r.includes("double rare") ||
    r.includes("ace spec") ||
    r.includes("radiant") ||
    r.includes("shiny") ||
    r.includes("rare holo") ||
    r === "rare" ||
    r === "promo" ||
    r.includes("rare") // catch "Rare ACE", "Rare BREAK", etc.
  ) {
    return "rare";
  }

  // ── Uncommon ─────────────────────────────────────────────────────────────
  if (r === "uncommon") return "uncommon";

  // ── Common (and anything unrecognised) ───────────────────────────────────
  return "common";
}

// ─── Pack odds ────────────────────────────────────────────────────────────────

/**
 * Intentionally difficult pack odds matching real TCG behaviour:
 *   Common: ~78%  Uncommon: ~17%  Rare: ~4%  Ultra: ~1%
 */
const PACK_ODDS: Record<string, number> = {
  common: 78,
  uncommon: 17,
  rare: 4,
  ultra: 1,
};

function rollRarity(): string {
  const total = Object.values(PACK_ODDS).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of Object.entries(PACK_ODDS)) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return "common";
}

function pickCard(pool: TcgdexCard[], rarity: string): TcgdexCard | null {
  const filtered = pool.filter((c) => c.rarity === rarity);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// ─── Server-side in-memory cache ─────────────────────────────────────────────

interface CacheEntry {
  cards: TcgdexCard[];
  fetchedAt: number;
}

/** 1-hour TTL */
const CACHE_TTL_MS = 60 * 60 * 1_000;

const _cardCache = new Map<string, CacheEntry>();

// ─── Internal API types ───────────────────────────────────────────────────────

interface TcgdexApiCard {
  id?: string;
  localId?: string;
  name?: string;
  image?: string;
  rarity?: string;
}

interface TcgdexApiSet {
  id?: string;
  name?: string;
  cards?: TcgdexApiCard[];
}

// ─── API fetching ─────────────────────────────────────────────────────────────

const TCGDEX_API_BASE = "https://api.tcgdex.net/v2/en";

/**
 * Fetch all cards for a set from the TCGdex API.
 * Results are cached in-memory for `CACHE_TTL_MS` milliseconds.
 *
 * @param tcgdexId      - TCGdex set ID, e.g. "sv8pt5"
 * @param setDisplayName - Human-readable name stored on each returned card
 * @throws if the ID is not in the canonical POKEMON_SETS allowlist
 * @throws if the API returns a non-2xx status
 */
export async function fetchSetCards(
  tcgdexId: string,
  setDisplayName: string
): Promise<TcgdexCard[]> {
  // Guard against SSRF — only allow IDs from the canonical allowlist
  if (!POKEMON_SETS.some((s) => s.tcgdexId === tcgdexId)) {
    throw new Error(`Set ID "${tcgdexId}" is not in the allowed set list`);
  }

  // Serve from cache if still fresh
  const cached = _cardCache.get(tcgdexId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.cards;
  }

  const url = `${TCGDEX_API_BASE}/sets/${tcgdexId}`;
  const res = await fetch(url, {
    // Next.js route-level data cache: revalidate every hour
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(
      `TCGdex API error ${res.status} fetching set "${tcgdexId}"`
    );
  }

  const data = (await res.json()) as TcgdexApiSet;
  const rawCards: TcgdexApiCard[] = data.cards ?? [];

  const cards: TcgdexCard[] = rawCards
    .filter((c): c is TcgdexApiCard & { name: string } => Boolean(c.name))
    .map((c) => ({
      id: c.id ?? `${tcgdexId}-${c.localId ?? "unknown"}`,
      name: c.name!,
      // TCGdex image fields omit the file extension; append /high.webp for HQ
      image: c.image ? `${c.image}/high.webp` : "",
      rarity: normalizeRarity(c.rarity),
      setName: setDisplayName,
    }))
    .filter((c) => c.image !== "");

  _cardCache.set(tcgdexId, { cards, fetchedAt: Date.now() });
  return cards;
}

// ─── Pack generation ──────────────────────────────────────────────────────────

const PACK_SIZE = 5;

/**
 * Generate a 5-card pack for the given Pokémon set using TCGdex data.
 *
 * Rules:
 * - Each slot rolls a rarity using `PACK_ODDS`.
 * - If no card exists for the rolled rarity, falls back down the tier list.
 * - Guarantees at least 1 card is Uncommon or higher.
 *
 * @param tcgdexId      - TCGdex set ID
 * @param setDisplayName - Human-readable set name
 */
export async function buildTcgdexPack(
  tcgdexId: string,
  setDisplayName: string
): Promise<TcgdexCard[]> {
  const allCards = await fetchSetCards(tcgdexId, setDisplayName);

  if (allCards.length === 0) {
    throw new Error(`No cards found for set "${tcgdexId}"`);
  }

  const result: TcgdexCard[] = [];
  let hasAtLeastUncommon = false;

  for (let i = 0; i < PACK_SIZE; i++) {
    const rarity = rollRarity();

    if (rarity !== "common") {
      hasAtLeastUncommon = true;
    }

    // Try rolled rarity first, then fall back through the tiers
    const card =
      pickCard(allCards, rarity) ??
      pickCard(allCards, "rare") ??
      pickCard(allCards, "uncommon") ??
      pickCard(allCards, "common") ??
      allCards[Math.floor(Math.random() * allCards.length)];

    result.push(card);
  }

  // Guarantee at least 1 uncommon-or-better
  if (!hasAtLeastUncommon) {
    const betterPool = allCards.filter(
      (c) => c.rarity === "uncommon" || c.rarity === "rare" || c.rarity === "ultra"
    );
    if (betterPool.length > 0) {
      result[PACK_SIZE - 1] =
        betterPool[Math.floor(Math.random() * betterPool.length)];
    }
  }

  return result;
}
