import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getProductBySlug } from "@/lib/products";
import { getStripeSecretKey, getBaseUrl } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-03-25.dahlia",
    });

    const body = await req.json() as { items: { productId: string; quantity: number }[] };
    const { items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
      ({ productId, quantity }) => {
        const product = getProductBySlug(productId);
        if (!product) throw new Error(`Unknown product: ${productId}`);
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.tagline,
            },
            unit_amount: product.price,
          },
          quantity,
        };
      }
    );

    const baseUrl = getBaseUrl();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
