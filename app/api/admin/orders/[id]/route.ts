import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "orders:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const orders = await sql`SELECT * FROM orders WHERE id = ${id}`;
    if (orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const [items, statusHistory] = await Promise.all([
      sql`SELECT * FROM order_items WHERE order_id = ${id}`,
      sql`SELECT * FROM order_status_history WHERE order_id = ${id} ORDER BY created_at ASC`,
    ]);

    return NextResponse.json({ ...orders[0], items, status_history: statusHistory });
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
    const existing = await sql<{ status: string }[]>`SELECT status FROM orders WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const { status, notes } = body;

    await sql`
      UPDATE orders SET
        status = COALESCE(${status as string | null ?? null}, status),
        notes = COALESCE(${notes as string | null ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    if (status && status !== existing[0].status) {
      await sql`
        INSERT INTO order_status_history (order_id, status, note, admin_id)
        VALUES (${id}, ${status as string}, ${body.note as string | null ?? null}, ${admin.id})
      `;
    }

    await createAuditLog(
      admin.id, "update", "order", id,
      { status, notes },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql`SELECT * FROM orders WHERE id = ${id}`;
    return NextResponse.json(updated[0]);
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
    const existing = await sql`SELECT id FROM orders WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const body = await req.json() as { action: "refund" | "cancel" };
    const { action } = body;

    if (!["refund", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Use 'refund' or 'cancel'" }, { status: 400 });
    }

    const newStatus = action === "refund" ? "refunded" : "cancelled";

    await sql`UPDATE orders SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id}`;
    await sql`
      INSERT INTO order_status_history (order_id, status, note, admin_id)
      VALUES (${id}, ${newStatus}, ${`Order ${action}ed by admin`}, ${admin.id})
    `;

    await createAuditLog(
      admin.id, action, "order", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql`SELECT * FROM orders WHERE id = ${id}`;
    return NextResponse.json(updated[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
