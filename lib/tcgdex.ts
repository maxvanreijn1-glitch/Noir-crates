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
  /** Pack price in GBP */
  priceGBP: number;
}

/** A Pokémon set entry as returned by the /api/tcgdex/sets endpoint */
export interface PokemonSetSummary {
  /** Canonical TCGdex set ID resolved from the live API (or fallback) */
  id: string;
  name: string;
  releaseDate: string;
  priceGBP: number;
}

// ─── Canonical set list ──────────────────────────────────────────────────────

/**
 * Supported Pokémon sets mapped to their TCGdex set IDs.
 * Order matches the UI picker (newest → oldest).
 * IDs are resolved dynamically from the TCGdex API; this list is the fallback.
 */
export const POKEMON_SETS: PokemonSet[] = [
  { name: "Prismatic Evolutions",  tcgdexId: "sv8pt5",    releaseYear: 2025, priceGBP: 4.99 },
  { name: "Surging Sparks",        tcgdexId: "sv8",       releaseYear: 2024, priceGBP: 4.99 },
  { name: "Stellar Crown",         tcgdexId: "sv7",       releaseYear: 2024, priceGBP: 4.99 },
  { name: "Twilight Masquerade",   tcgdexId: "sv6",       releaseYear: 2024, priceGBP: 4.99 },
  { name: "Temporal Forces",       tcgdexId: "sv5",       releaseYear: 2024, priceGBP: 4.99 },
  { name: "Paldean Fates",         tcgdexId: "sv4pt5",    releaseYear: 2024, priceGBP: 4.99 },
  { name: "Paradox Rift",          tcgdexId: "sv4",       releaseYear: 2023, priceGBP: 4.99 },
  { name: "Obsidian Flames",       tcgdexId: "sv3",       releaseYear: 2023, priceGBP: 4.99 },
  { name: "Scarlet & Violet Base", tcgdexId: "sv1",       releaseYear: 2023, priceGBP: 4.99 },
  { name: "Crown Zenith",          tcgdexId: "swsh12pt5", releaseYear: 2023, priceGBP: 4.99 },
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

function getTcgdexApiBase(): string {
  const base = process.env.TCGDEX_BASE_URL ?? "https://api.tcgdex.net";
  return `${base}/v2/en`;
}

// ─── TCGdex sets list ─────────────────────────────────────────────────────────

interface TcgdexApiSetSummary {
  id?: string;
  name?: string;
  releaseDate?: string;
}

/**
 * Fetch the full set list from the TCGdex API and resolve canonical IDs for
 * each entry in POKEMON_SETS.
 *
 * Matching strategy (in order):
 *   1. Exact id match against our hardcoded `tcgdexId`.
 *   2. Normalised name match (lowercase, non-alphanumeric stripped).
 *
 * If neither match is found the hardcoded `tcgdexId` is used as-is so the
 * caller always gets a usable result.
 *
 * @throws if the TCGdex sets-list request fails
 */
export async function fetchCanonicalSets(): Promise<PokemonSetSummary[]> {
  const url = `${getTcgdexApiBase()}/sets`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(
      `TCGdex API error ${res.status} fetching sets list from "${url}". Body: ${await res.text()}`
    );
  }

  const apiSets = (await res.json()) as TcgdexApiSetSummary[];

  return POKEMON_SETS.map((known) => {
    // 1. Exact ID match
    let match = apiSets.find((s) => s.id === known.tcgdexId);
    // 2. Normalised name match
    if (!match) {
      const normalised = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const targetName = normalised(known.name);
      match = apiSets.find((s) => s.name && normalised(s.name) === targetName);
    }
    return {
      id: match?.id ?? known.tcgdexId,
      name: known.name,
      releaseDate: match?.releaseDate ?? `${known.releaseYear}-01-01`,
      priceGBP: known.priceGBP,
    };
  });
}

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
  // Guard against SSRF — only allow IDs from the canonical allowlist, and use
  // the value sourced from the allowlist (not the raw user input) in the URL.
  const setMeta = POKEMON_SETS.find((s) => s.tcgdexId === tcgdexId);
  if (!setMeta) {
    throw new Error(`Set ID "${tcgdexId}" is not in the allowed set list`);
  }
  // Use the canonical value from the allowlist, not the raw caller argument
  const canonicalId = setMeta.tcgdexId;

  // Serve from cache if still fresh
  const cached = _cardCache.get(canonicalId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.cards;
  }

  const url = `${getTcgdexApiBase()}/sets/${canonicalId}`;
  const res = await fetch(url, {
    // Next.js route-level data cache: revalidate every hour
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(
      `TCGdex API error ${res.status} fetching set "${canonicalId}" from "${url}"`
    );
  }

  const data = (await res.json()) as TcgdexApiSet;
  const rawCards: TcgdexApiCard[] = data.cards ?? [];

  const cards: TcgdexCard[] = rawCards
    .filter((c): c is TcgdexApiCard & { name: string } => typeof c.name === "string" && c.name.length > 0)
    .map((c) => ({
      id: c.id ?? `${canonicalId}-${c.localId ?? "unknown"}`,
      name: c.name,
      // TCGdex image fields omit the file extension; append /high.webp for HQ
      image: c.image ? `${c.image}/high.webp` : "",
      rarity: normalizeRarity(c.rarity),
      setName: setDisplayName,
    }))
    .filter((c) => c.image !== "");

  _cardCache.set(canonicalId, { cards, fetchedAt: Date.now() });
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
