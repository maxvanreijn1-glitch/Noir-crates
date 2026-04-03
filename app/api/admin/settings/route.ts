import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "settings:read");
    if (admin instanceof NextResponse) return admin;

    const rows = await sql<{ key: string; value: string }[]>`SELECT key, value FROM settings`;
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "settings:write");
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as Record<string, string>;
    if (typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be a key/value object" }, { status: 400 });
    }

    for (const [key, value] of Object.entries(body)) {
      await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES (${key}, ${String(value)}, NOW())
        ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
      `;
    }

    await createAuditLog(
      admin.id, "update", "settings", null,
      { keys: Object.keys(body) },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const rows = await sql<{ key: string; value: string }[]>`SELECT key, value FROM settings`;
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
