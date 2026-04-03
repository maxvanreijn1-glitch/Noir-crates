import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "customers:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const orders = db.prepare(
      "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC"
    ).all(id);
    const addresses = db.prepare(
      "SELECT * FROM customer_addresses WHERE customer_id = ?"
    ).all(id);
    const notes = db.prepare(
      "SELECT * FROM customer_notes WHERE customer_id = ? ORDER BY created_at DESC"
    ).all(id);

    return NextResponse.json({ ...customer as object, orders, addresses, notes });
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
    const existing = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE customers SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        is_banned = COALESCE(?, is_banned),
        ban_reason = COALESCE(?, ban_reason),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.name ?? null,
      body.email ?? null,
      body.phone ?? null,
      body.is_banned !== undefined ? (body.is_banned ? 1 : 0) : null,
      body.ban_reason ?? null,
      now,
      id,
    );

    createAuditLog(
      admin.id, "update", "customer", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    return NextResponse.json(updated);
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
    const existing = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await req.json() as { action: string; note?: string };
    if (body.action !== "add_note") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!body.note) {
      return NextResponse.json({ error: "note is required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO customer_notes (customer_id, admin_id, note)
      VALUES (?, ?, ?)
    `).run(id, admin.id, body.note);

    const note = db.prepare("SELECT * FROM customer_notes WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
