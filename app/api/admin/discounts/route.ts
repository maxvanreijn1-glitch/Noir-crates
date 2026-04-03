import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "discounts:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM discounts`;
    const data = await sql`SELECT * FROM discounts ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    const total = parseInt(countResult[0].count);

    return NextResponse.json({ data, total, pages: Math.ceil(total / limit) });
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

    const isActive = body.is_active !== undefined ? (body.is_active ? true : false) : true;

    const [discount] = await sql<[Record<string, unknown>]>`
      INSERT INTO discounts (code, type, value, min_order_cents, max_uses, is_active, starts_at, expires_at, description)
      VALUES (
        ${(code as string).toUpperCase()},
        ${type as string},
        ${value as number},
        ${body.min_order_cents as number ?? 0},
        ${body.max_uses as number | null ?? null},
        ${isActive},
        ${body.starts_at as string | null ?? null},
        ${body.expires_at as string | null ?? null},
        ${body.description as string | null ?? null}
      )
      RETURNING *
    `;

    await createAuditLog(
      admin.id, "create", "discount",
      discount.id as number,
      { code, type },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
