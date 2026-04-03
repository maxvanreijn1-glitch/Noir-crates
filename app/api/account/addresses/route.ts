import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const addresses = await sql`
    SELECT * FROM customer_addresses WHERE customer_id = ${customer.id} ORDER BY id DESC
  `;
  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  try {
    const body = await req.json() as Record<string, unknown>;
    const { line1, line2, city, state, postal_code, country, type, name, is_default } = body as {
      line1?: string; line2?: string; city?: string; state?: string;
      postal_code?: string; country?: string; type?: string; name?: string; is_default?: boolean;
    };

    if (!line1 || !city || !postal_code || !country) {
      return NextResponse.json({ error: "line1, city, postal_code, and country are required" }, { status: 400 });
    }

    const [address] = await sql<[Record<string, unknown>]>`
      INSERT INTO customer_addresses (customer_id, type, name, line1, line2, city, state, postal_code, country, is_default)
      VALUES (
        ${customer.id},
        ${type ?? "shipping"},
        ${name ?? null},
        ${line1},
        ${line2 ?? null},
        ${city},
        ${state ?? null},
        ${postal_code},
        ${country},
        ${is_default ? true : false}
      )
      RETURNING *
    `;
    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
