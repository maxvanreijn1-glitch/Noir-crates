import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  const existing = db.prepare(
    "SELECT * FROM customer_addresses WHERE id = ? AND customer_id = ?"
  ).get(id, customer.id);
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    db.prepare(`
      UPDATE customer_addresses
      SET type        = COALESCE(?, type),
          name        = COALESCE(?, name),
          line1       = COALESCE(?, line1),
          line2       = COALESCE(?, line2),
          city        = COALESCE(?, city),
          state       = COALESCE(?, state),
          postal_code = COALESCE(?, postal_code),
          country     = COALESCE(?, country),
          is_default  = COALESCE(?, is_default)
      WHERE id = ? AND customer_id = ?
    `).run(
      body.type ?? null,
      body.name ?? null,
      body.line1 ?? null,
      body.line2 ?? null,
      body.city ?? null,
      body.state ?? null,
      body.postal_code ?? null,
      body.country ?? null,
      body.is_default !== undefined ? (body.is_default ? 1 : 0) : null,
      id,
      customer.id
    );

    const updated = db.prepare("SELECT * FROM customer_addresses WHERE id = ?").get(id);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const { id } = await params;

  const existing = db.prepare(
    "SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?"
  ).get(id, customer.id);
  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  db.prepare("DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?")
    .run(id, customer.id);
  return NextResponse.json({ ok: true });
}
