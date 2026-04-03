import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "payments:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(id);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "payments:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = db.prepare("SELECT * FROM payments WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const body = await req.json() as { fraud_flag?: boolean; fraud_reason?: string };
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE payments SET
        fraud_flag = COALESCE(?, fraud_flag),
        fraud_reason = COALESCE(?, fraud_reason),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.fraud_flag !== undefined ? (body.fraud_flag ? 1 : 0) : null,
      body.fraud_reason ?? null,
      now,
      id,
    );

    createAuditLog(
      admin.id, "update", "payment", id,
      { fraud_flag: body.fraud_flag, fraud_reason: body.fraud_reason },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare("SELECT * FROM payments WHERE id = ?").get(id);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
