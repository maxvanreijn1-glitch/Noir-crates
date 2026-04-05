import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeSecretKey, getBaseUrl } from "@/lib/env";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { TCG_GAMES } from "@/lib/tcg-data";
import type { PackType } from "@/lib/packs/types";
import { PACK_TYPE_PRICE_MULTIPLIERS } from "@/lib/packs/types";

const VALID_PACK_TYPES: PackType[] = ["basic", "premium", "elite"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      tcgId?: string;
      setId?: string;
      packType?: string;
      boostMeter?: number;
    };
    const { tcgId, setId } = body;
    const packType: PackType = VALID_PACK_TYPES.includes(body.packType as PackType)
      ? (body.packType as PackType)
      : "basic";
    const boostMeter = Math.min(100, Math.max(0, Math.round(body.boostMeter ?? 0)));

    if (!tcgId || !setId) {
      return NextResponse.json({ error: "tcgId and setId are required" }, { status: 400 });
    }

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

    const priceMultiplier = PACK_TYPE_PRICE_MULTIPLIERS[packType];
    const unitAmount = Math.round(set.priceGBP * priceMultiplier * 100);

    const metadata: Record<string, string> = {
      type: "pack_opener",
      tcgId,
      setId,
      packType,
      boostMeter: String(boostMeter),
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
            unit_amount: unitAmount,
            product_data: {
              name: `${game.name} — ${set.name} ${packType.charAt(0).toUpperCase() + packType.slice(1)} Pack`,
              description: `Virtual ${packType} booster pack opening for ${set.name}`,
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

