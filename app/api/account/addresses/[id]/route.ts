import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  const existing = await sql`
    SELECT id FROM customer_addresses WHERE id = ${id} AND customer_id = ${customer.id}
  `;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const isDefault = body.is_default !== undefined ? (body.is_default ? true : false) : null;
    await sql`
      UPDATE customer_addresses
      SET type        = COALESCE(${body.type as string | null ?? null}, type),
          name        = COALESCE(${body.name as string | null ?? null}, name),
          line1       = COALESCE(${body.line1 as string | null ?? null}, line1),
          line2       = COALESCE(${body.line2 as string | null ?? null}, line2),
          city        = COALESCE(${body.city as string | null ?? null}, city),
          state       = COALESCE(${body.state as string | null ?? null}, state),
          postal_code = COALESCE(${body.postal_code as string | null ?? null}, postal_code),
          country     = COALESCE(${body.country as string | null ?? null}, country),
          is_default  = COALESCE(${isDefault}, is_default)
      WHERE id = ${id} AND customer_id = ${customer.id}
    `;

    const updated = await sql`SELECT * FROM customer_addresses WHERE id = ${id}`;
    return NextResponse.json(updated[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  const existing = await sql`
    SELECT id FROM customer_addresses WHERE id = ${id} AND customer_id = ${customer.id}
  `;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  await sql`DELETE FROM customer_addresses WHERE id = ${id} AND customer_id = ${customer.id}`;
  return NextResponse.json({ ok: true });
}
