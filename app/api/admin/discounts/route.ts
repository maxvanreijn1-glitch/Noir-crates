import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog, paginatedQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "discounts:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const result = paginatedQuery("discounts", "", [], page, limit);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "discounts:write");
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as Record<string, unknown>;
    const { code, type, value } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: code, type, value" },
        { status: 400 }
      );
    }
    if (!["percentage", "fixed"].includes(type as string)) {
      return NextResponse.json({ error: "type must be 'percentage' or 'fixed'" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO discounts (code, type, value, min_order_cents, max_uses, is_active,
        starts_at, expires_at, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      (code as string).toUpperCase(),
      type,
      value,
      body.min_order_cents ?? 0,
      body.max_uses ?? null,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      body.starts_at ?? null,
      body.expires_at ?? null,
      body.description ?? null,
    );

    const discount = db.prepare("SELECT * FROM discounts WHERE id = ?").get(result.lastInsertRowid);

    createAuditLog(
      admin.id, "create", "discount",
      result.lastInsertRowid as number,
      { code, type },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
