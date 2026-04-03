import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-guard";
import { getCustomerById } from "@/lib/db";

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const data = getCustomerById(customer.id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    email_verified: data.email_verified,
    created_at: data.created_at,
  });
}
