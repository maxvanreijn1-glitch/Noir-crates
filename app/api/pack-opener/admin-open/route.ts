import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { buildPackCards } from "@/lib/pack-opener";
import { TCG_GAMES } from "@/lib/tcg-data";
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

    const game = TCG_GAMES.find((g) => g.id === tcgId);
    if (!game) {
      return NextResponse.json({ error: "TCG not found" }, { status: 404 });
    }

    const set = game.sets.find((s) => s.id === setId);
    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    const cards = buildPackCards(tcgId, setId);

    // Persist the opening so admin test packs appear in history
    let openingId = 0;
    try {
      const sessionId = `admin-test-${adminOrError.id}-${crypto.randomUUID()}`;
      const [opening] = await sql<{ id: number }[]>`
        INSERT INTO pack_openings
          (session_id, customer_id, tcg_id, set_id, tcg_name, set_name, status)
        VALUES
          (${sessionId}, NULL, ${tcgId}, ${setId}, ${game.name}, ${set.name}, 'opened')
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
      tcg: game.name,
      setName: set.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
