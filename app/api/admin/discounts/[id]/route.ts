import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "discounts:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const discounts = await sql`SELECT * FROM discounts WHERE id = ${id}`;
    if (discounts.length === 0) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }
    return NextResponse.json(discounts[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "discounts:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM discounts WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const isActive = body.is_active !== undefined ? (body.is_active ? true : false) : null;
    const code = body.code ? (body.code as string).toUpperCase() : null;

    await sql`
      UPDATE discounts SET
        code = COALESCE(${code}, code),
        type = COALESCE(${body.type as string | null ?? null}, type),
        value = COALESCE(${body.value as number | null ?? null}, value),
        min_order_cents = COALESCE(${body.min_order_cents as number | null ?? null}, min_order_cents),
        max_uses = COALESCE(${body.max_uses as number | null ?? null}, max_uses),
        is_active = COALESCE(${isActive}, is_active),
        starts_at = COALESCE(${body.starts_at as string | null ?? null}, starts_at),
        expires_at = COALESCE(${body.expires_at as string | null ?? null}, expires_at),
        description = COALESCE(${body.description as string | null ?? null}, description)
      WHERE id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "discount", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql`SELECT * FROM discounts WHERE id = ${id}`;
    return NextResponse.json(updated[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "discounts:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM discounts WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    await sql`DELETE FROM discounts WHERE id = ${id}`;

    await createAuditLog(
      admin.id, "delete", "discount", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
