import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, getCustomerById } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  try {
    const data = getCustomerById(customer.id);
    if (!data?.stripe_customer_id) return NextResponse.json([]);

    const stripe = getStripe();
    const methods = await stripe.paymentMethods.list({
      customer: data.stripe_customer_id,
      type: "card",
    });
    return NextResponse.json(methods.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  try {
    const body = await req.json() as { payment_method_id?: string };
    if (!body.payment_method_id) {
      return NextResponse.json({ error: "payment_method_id is required" }, { status: 400 });
    }

    const stripe = getStripe();
    let data = getCustomerById(customer.id);
    if (!data) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    let stripeCustomerId = data.stripe_customer_id;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: data.email,
        name: data.name ?? undefined,
      });
      stripeCustomerId = stripeCustomer.id;
      db.prepare("UPDATE customers SET stripe_customer_id = ?, updated_at = ? WHERE id = ?")
        .run(stripeCustomerId, new Date().toISOString(), customer.id);
    }

    await stripe.paymentMethods.attach(body.payment_method_id, { customer: stripeCustomerId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
