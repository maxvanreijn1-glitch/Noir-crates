import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "discounts:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const discount = db.prepare("SELECT * FROM discounts WHERE id = ?").get(id);
    if (!discount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }
    return NextResponse.json(discount);
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
    const existing = db.prepare("SELECT * FROM discounts WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;

    db.prepare(`
      UPDATE discounts SET
        code = COALESCE(?, code),
        type = COALESCE(?, type),
        value = COALESCE(?, value),
        min_order_cents = COALESCE(?, min_order_cents),
        max_uses = COALESCE(?, max_uses),
        is_active = COALESCE(?, is_active),
        starts_at = COALESCE(?, starts_at),
        expires_at = COALESCE(?, expires_at),
        description = COALESCE(?, description)
      WHERE id = ?
    `).run(
      body.code ? (body.code as string).toUpperCase() : null,
      body.type ?? null,
      body.value ?? null,
      body.min_order_cents ?? null,
      body.max_uses ?? null,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : null,
      body.starts_at ?? null,
      body.expires_at ?? null,
      body.description ?? null,
      id,
    );

    createAuditLog(
      admin.id, "update", "discount", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare("SELECT * FROM discounts WHERE id = ?").get(id);
    return NextResponse.json(updated);
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
    const existing = db.prepare("SELECT * FROM discounts WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM discounts WHERE id = ?").run(id);

    createAuditLog(
      admin.id, "delete", "discount", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
