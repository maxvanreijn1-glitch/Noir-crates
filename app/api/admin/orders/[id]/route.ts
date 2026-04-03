import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "orders:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);
    const statusHistory = db.prepare(
      "SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC"
    ).all(id);

    return NextResponse.json({ ...order as object, items, status_history: statusHistory });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "orders:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as { status: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const { status, notes } = body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE orders SET
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = ?
      WHERE id = ?
    `).run(status ?? null, notes ?? null, now, id);

    if (status && status !== existing.status) {
      db.prepare(`
        INSERT INTO order_status_history (order_id, status, note, admin_id)
        VALUES (?, ?, ?, ?)
      `).run(id, status, body.note ?? null, admin.id);
    }

    createAuditLog(
      admin.id, "update", "order", id,
      { status, notes },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "orders:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json() as { action: "refund" | "cancel" };
    const { action } = body;

    if (!["refund", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'refund' or 'cancel'" }, { status: 400 });
    }

    const newStatus = action === "refund" ? "refunded" : "cancelled";
    const now = new Date().toISOString();

    db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
      .run(newStatus, now, id);

    db.prepare(`
      INSERT INTO order_status_history (order_id, status, note, admin_id)
      VALUES (?, ?, ?, ?)
    `).run(id, newStatus, `Order ${action}ed by admin`, admin.id);

    createAuditLog(
      admin.id, action, "order", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
