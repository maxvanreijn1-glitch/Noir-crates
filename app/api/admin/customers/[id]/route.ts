import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "customers:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const customers = await sql`SELECT * FROM customers WHERE id = ${id}`;
    if (customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    const customer = customers[0];

    const [orders, addresses, notes] = await Promise.all([
      sql`SELECT * FROM orders WHERE customer_id = ${id} ORDER BY created_at DESC`,
      sql`SELECT * FROM customer_addresses WHERE customer_id = ${id}`,
      sql`SELECT * FROM customer_notes WHERE customer_id = ${id} ORDER BY created_at DESC`,
    ]);

    const totalSpend = (orders as unknown as { total_cents: number }[]).reduce((s, o) => s + o.total_cents, 0);
    return NextResponse.json({ ...customer, orders, addresses, notes, total_spend_cents: totalSpend });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "customers:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM customers WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const isBanned = body.is_banned !== undefined ? (body.is_banned ? true : false) : null;

    await sql`
      UPDATE customers SET
        name = COALESCE(${body.name as string | null ?? null}, name),
        email = COALESCE(${body.email as string | null ?? null}, email),
        phone = COALESCE(${body.phone as string | null ?? null}, phone),
        is_banned = COALESCE(${isBanned}, is_banned),
        ban_reason = COALESCE(${body.ban_reason as string | null ?? null}, ban_reason),
        admin_notes = COALESCE(${body.admin_notes as string | null ?? null}, admin_notes),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "customer", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql`SELECT * FROM customers WHERE id = ${id}`;
    return NextResponse.json(updated[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "customers:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM customers WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await req.json() as { action: string; note?: string };
    if (body.action !== "add_note") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!body.note) {
      return NextResponse.json({ error: "note is required" }, { status: 400 });
    }

    const [note] = await sql<[Record<string, unknown>]>`
      INSERT INTO customer_notes (customer_id, admin_id, note)
      VALUES (${id}, ${admin.id}, ${body.note})
      RETURNING *
    `;
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
