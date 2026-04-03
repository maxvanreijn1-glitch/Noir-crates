import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCustomerById } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  try {
    const data = await getCustomerById(customer.id);
    if (!data?.stripe_customer_id) {
      return NextResponse.json({ error: "No payment methods" }, { status: 404 });
    }

    const stripe = getStripe();
    await stripe.paymentMethods.detach(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
