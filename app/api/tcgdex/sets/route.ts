import { NextResponse } from "next/server";
import { fetchCanonicalSets, POKEMON_SETS, type PokemonSetSummary } from "@/lib/tcgdex";

/**
 * GET /api/tcgdex/sets
 *
 * Returns the list of supported Pokémon sets with canonical TCGdex IDs.
 *
 * IDs are resolved by querying the live TCGdex API so they always match what
 * the API expects.  If TCGdex is unreachable the response falls back to the
 * hardcoded POKEMON_SETS list so the UI can still function.
 *
 * Response shape: PokemonSetSummary[]
 *   { id: string; name: string; releaseDate: string; priceGBP: number }
 *
 * Cache: revalidated every hour via Next.js fetch cache.
 */
export const revalidate = 3600;

export async function GET() {
  let sets: PokemonSetSummary[];

  try {
    sets = await fetchCanonicalSets();
  } catch (err) {
    // TCGdex unreachable — fall back to the hardcoded allowlist
    console.warn(
      "[api/tcgdex/sets] TCGdex unavailable, using local fallback:",
      err instanceof Error ? err.message : err
    );
    sets = POKEMON_SETS.map((s) => ({
      id: s.tcgdexId,
      name: s.name,
      releaseDate: `${s.releaseYear}-01-01`,
      priceGBP: s.priceGBP,
    }));
  }

  return NextResponse.json(sets, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
