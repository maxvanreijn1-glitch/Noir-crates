import { NextRequest, NextResponse } from "next/server";
import { POKEMON_SETS, buildTcgdexPack } from "@/lib/tcgdex";

/**
 * POST /api/pack-opener/tcgdex-open
 *
 * Opens a virtual Pokémon TCG booster pack using live card data from TCGdex.
 * No payment required — this endpoint is public and intended for the
 * free virtual pack-opening demo.
 *
 * Body: { tcgdexId: string }
 *   tcgdexId — TCGdex set identifier (e.g. "sv8pt5")
 *
 * Returns: { cards: TcgdexCard[]; setName: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { tcgdexId?: string };
    const { tcgdexId } = body;

    if (!tcgdexId) {
      return NextResponse.json(
        { error: "tcgdexId is required" },
        { status: 400 }
      );
    }

    const setMeta = POKEMON_SETS.find((s) => s.tcgdexId === tcgdexId);
    if (!setMeta) {
      return NextResponse.json(
        { error: `Unknown set: ${tcgdexId}` },
        { status: 404 }
      );
    }

    const cards = await buildTcgdexPack(tcgdexId, setMeta.name);

    return NextResponse.json({ cards, setName: setMeta.name });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
