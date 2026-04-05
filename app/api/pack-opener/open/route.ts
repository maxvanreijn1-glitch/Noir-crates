import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/env";
import { sql } from "@/lib/db";
import { buildPackCards } from "@/lib/pack-opener";
import { TCG_GAMES } from "@/lib/tcg-data";
import { getCustomerFromRequest } from "@/lib/customer-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-03-25.dahlia",
    });

    let stripeSession: Stripe.Checkout.Session;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    if (stripeSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
    }

    const metadata = stripeSession.metadata ?? {};
    if (metadata.type !== "pack_opener") {
      return NextResponse.json({ error: "Invalid session type" }, { status: 400 });
    }

    const { tcgId, setId } = metadata;
    if (!tcgId || !setId) {
      return NextResponse.json({ error: "Missing pack metadata" }, { status: 400 });
    }

    const game = TCG_GAMES.find(g => g.id === tcgId);
    const set = game?.sets.find(s => s.id === setId);
    if (!game || !set) {
      return NextResponse.json({ error: "TCG or set not found" }, { status: 404 });
    }

    // Check if already opened
    try {
      const existing = await sql<{ id: number }[]>`
        SELECT po.id FROM pack_openings po WHERE po.session_id = ${sessionId} LIMIT 1
      `;

      if (existing.length > 0) {
        const openingId = existing[0].id;
        const cards = await sql<{ card_name: string; card_image: string; card_rarity: string; card_set: string; position: number }[]>`
          SELECT card_name, card_image, card_rarity, card_set, position
          FROM pack_opening_cards
          WHERE opening_id = ${openingId}
          ORDER BY position ASC
        `;
        return NextResponse.json({
          openingId,
          cards: cards.map(c => ({
            id: `card-${c.position}`,
            name: c.card_name,
            image: c.card_image,
            rarity: c.card_rarity,
            setName: c.card_set,
          })),
          tcg: game.name,
          setName: set.name,
        });
      }

      // Generate new pack
      const generatedCards = buildPackCards(tcgId, setId);

      // Optional customer from token
      const customer = await getCustomerFromRequest(req);
      const customerId = metadata.customerId ? parseInt(metadata.customerId, 10) : customer?.id ?? null;

      const [opening] = await sql<{ id: number }[]>`
        INSERT INTO pack_openings (session_id, customer_id, tcg_id, set_id, tcg_name, set_name, status)
        VALUES (${sessionId}, ${customerId}, ${tcgId}, ${setId}, ${game.name}, ${set.name}, 'opened')
        RETURNING id
      `;

      const openingId = opening.id;

      // Insert cards
      for (let i = 0; i < generatedCards.length; i++) {
        const card = generatedCards[i];
        await sql`
          INSERT INTO pack_opening_cards (opening_id, card_name, card_image, card_rarity, card_set, position)
          VALUES (${openingId}, ${card.name}, ${card.image}, ${card.rarity}, ${card.setName}, ${i})
        `;
      }

      return NextResponse.json({
        openingId,
        cards: generatedCards,
        tcg: game.name,
        setName: set.name,
      });
    } catch (dbError) {
      // DB not available — return cards without persisting
      console.error("[pack-opener/open] DB error:", dbError);
      const generatedCards = buildPackCards(tcgId, setId);
      return NextResponse.json({
        openingId: 0,
        cards: generatedCards,
        tcg: game.name,
        setName: set.name,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
