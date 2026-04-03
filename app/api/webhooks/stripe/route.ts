import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe secret key not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: "2026-03-25.dahlia" as any,
  });

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email ?? session.customer_email ?? null;

      let customerId: number | null = null;
      if (email) {
        const existing = await sql<[{ id: number }]>`SELECT id FROM customers WHERE email = ${email} LIMIT 1`;
        if (existing.length > 0) {
          customerId = existing[0].id;
        } else {
          const stripeCustomer = (session.customer as string) ?? null;
          const [inserted] = await sql<[{ id: number }]>`
            INSERT INTO customers (email, stripe_customer_id) VALUES (${email}, ${stripeCustomer}) RETURNING id
          `;
          customerId = inserted.id;
        }
      }

      const orderNumber = `ORD-${session.id.slice(-8).toUpperCase()}`;
      const totalCents = session.amount_total ?? 0;
      const currency = session.currency ?? "usd";
      const paymentIntent = (session.payment_intent as string) ?? null;

      const [order] = await sql<[{ id: number }]>`
        INSERT INTO orders (order_number, customer_id, status, total_cents,
          subtotal_cents, currency, stripe_session_id, stripe_payment_intent)
        VALUES (${orderNumber}, ${customerId}, 'pending', ${totalCents}, ${totalCents}, ${currency}, ${session.id}, ${paymentIntent})
        RETURNING id
      `;
      const orderId = order.id;

      await sql`
        INSERT INTO payments (order_id, stripe_payment_intent, amount_cents, currency, status, provider)
        VALUES (${orderId}, ${paymentIntent}, ${totalCents}, ${currency}, 'paid', 'stripe')
      `;

      await sql`
        INSERT INTO order_status_history (order_id, status, note)
        VALUES (${orderId}, 'pending', 'Order created via Stripe webhook')
      `;
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      await sql`
        UPDATE payments SET status = 'failed', updated_at = NOW()
        WHERE stripe_payment_intent = ${intent.id}
      `;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
