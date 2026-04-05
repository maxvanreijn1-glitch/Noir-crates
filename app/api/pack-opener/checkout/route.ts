import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeSecretKey, getBaseUrl } from "@/lib/env";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { TCG_GAMES } from "@/lib/tcg-data";
import { POKEMON_SETS } from "@/lib/tcgdex";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { tcgId?: string; setId?: string };
    const { tcgId, setId } = body;

    if (!tcgId || !setId) {
      return NextResponse.json({ error: "tcgId and setId are required" }, { status: 400 });
    }

    // For Pokémon, validate against canonical TCGdex set list
    if (tcgId === "pokemon") {
      const setMeta = POKEMON_SETS.find(s => s.tcgdexId === setId);
      if (!setMeta) {
        return NextResponse.json({ error: "Pokémon set not found" }, { status: 404 });
      }

      // Optional customer auth
      const customer = await getCustomerFromRequest(req);

      const stripe = new Stripe(getStripeSecretKey(), {
        apiVersion: "2026-03-25.dahlia",
      });
      const baseUrl = getBaseUrl();

      const metadata: Record<string, string> = {
        type: "pack_opener",
        tcgId,
        setId,
      };
      if (customer) {
        metadata.customerId = String(customer.id);
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "gbp",
              unit_amount: Math.round(setMeta.priceGBP * 100),
              product_data: {
                name: `Pokémon — ${setMeta.name} Booster Pack`,
                description: `Virtual booster pack opening for ${setMeta.name}`,
              },
            },
          },
        ],
        metadata,
        success_url: `${baseUrl}/pack-opener?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pack-opener`,
      });

      return NextResponse.json({ url: session.url });
    }

    // For other TCGs use the local static dataset
    const game = TCG_GAMES.find(g => g.id === tcgId);
    if (!game) {
      return NextResponse.json({ error: "TCG not found" }, { status: 404 });
    }
    const set = game.sets.find(s => s.id === setId);
    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    // Optional customer auth
    const customer = await getCustomerFromRequest(req);

    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-03-25.dahlia",
    });
    const baseUrl = getBaseUrl();

    const metadata: Record<string, string> = {
      type: "pack_opener",
      tcgId,
      setId,
    };
    if (customer) {
      metadata.customerId = String(customer.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(set.priceGBP * 100),
            product_data: {
              name: `${game.name} — ${set.name} Booster Pack`,
              description: `Virtual booster pack opening for ${set.name}`,
            },
          },
        },
      ],
      metadata,
      success_url: `${baseUrl}/pack-opener?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pack-opener`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
