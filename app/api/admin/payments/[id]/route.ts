import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "payments:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const payments = await sql`SELECT * FROM payments WHERE id = ${id}`;
    if (payments.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json(payments[0]);
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
    const existing = await sql`SELECT id FROM payments WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const body = await req.json() as { fraud_flag?: boolean; fraud_reason?: string };
    const fraudFlag = body.fraud_flag !== undefined ? body.fraud_flag : null;

    await sql`
      UPDATE payments SET
        fraud_flag = COALESCE(${fraudFlag}, fraud_flag),
        fraud_reason = COALESCE(${body.fraud_reason as string | null ?? null}, fraud_reason),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "payment", id,
      { fraud_flag: body.fraud_flag, fraud_reason: body.fraud_reason },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql`SELECT * FROM payments WHERE id = ${id}`;
    return NextResponse.json(updated[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
