import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { buildPackCards } from "@/lib/pack-opener";
import { TCG_GAMES } from "@/lib/tcg-data";
import { POKEMON_SETS, buildTcgdexPack } from "@/lib/tcgdex";
import { sql } from "@/lib/db";

/**
 * POST /api/pack-opener/admin-open
 *
 * Admin-only endpoint that bypasses Stripe payment and opens a pack for
 * testing purposes at zero cost.  Enforced server-side via admin JWT.
 */
export async function POST(req: NextRequest) {
  // Require a valid admin_token cookie – returns 401/403 NextResponse on failure
  const adminOrError = await requireAdmin(req);
  if (adminOrError instanceof NextResponse) return adminOrError;

  try {
    const body = (await req.json()) as { tcgId?: string; setId?: string };
    const { tcgId, setId } = body;

    if (!tcgId || !setId) {
      return NextResponse.json(
        { error: "tcgId and setId are required" },
        { status: 400 }
      );
    }

    // Resolve game/set names.
    // For Pokémon, validate against canonical TCGdex set list; for others use local data.
    let gameName: string;
    let setName: string;

    if (tcgId === "pokemon") {
      const setMeta = POKEMON_SETS.find((s) => s.tcgdexId === setId);
      if (!setMeta) {
        return NextResponse.json({ error: "Pokémon set not found" }, { status: 404 });
      }
      gameName = "Pokémon";
      setName = setMeta.name;
    } else {
      const game = TCG_GAMES.find((g) => g.id === tcgId);
      if (!game) {
        return NextResponse.json({ error: "TCG not found" }, { status: 404 });
      }
      const set = game.sets.find((s) => s.id === setId);
      if (!set) {
        return NextResponse.json({ error: "Set not found" }, { status: 404 });
      }
      gameName = game.name;
      setName = set.name;
    }

    // Generate pack. For Pokémon use live TCGdex data with local fallback.
    let cards;
    if (tcgId === "pokemon") {
      const setMeta = POKEMON_SETS.find((s) => s.tcgdexId === setId)!;
      try {
        cards = await buildTcgdexPack(setId, setMeta.name);
      } catch (tcgdexErr) {
        console.warn("[admin-open] TCGdex unavailable, using local fallback:", tcgdexErr);
        cards = buildPackCards(tcgId, setId);
      }
    } else {
      cards = buildPackCards(tcgId, setId);
    }

    // Persist the opening so admin test packs appear in history
    let openingId = 0;
    try {
      const sessionId = `admin-test-${adminOrError.id}-${crypto.randomUUID()}`;
      const [opening] = await sql<{ id: number }[]>`
        INSERT INTO pack_openings
          (session_id, customer_id, tcg_id, set_id, tcg_name, set_name, status)
        VALUES
          (${sessionId}, NULL, ${tcgId}, ${setId}, ${gameName}, ${setName}, 'opened')
        RETURNING id
      `;
      openingId = opening.id;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        await sql`
          INSERT INTO pack_opening_cards
            (opening_id, card_name, card_image, card_rarity, card_set, position)
          VALUES
            (${openingId}, ${card.name}, ${card.image}, ${card.rarity}, ${card.setName}, ${i})
        `;
      }
    } catch (dbError) {
      // DB unavailable — still return cards without persisting
      console.error("[admin-open] DB error (non-fatal):", dbError);
    }

    return NextResponse.json({
      openingId,
      cards,
      tcg: gameName,
      setName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
