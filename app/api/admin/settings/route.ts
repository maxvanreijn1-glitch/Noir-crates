import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "settings:read");
    if (admin instanceof NextResponse) return admin;

    const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
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

    const now = new Date().toISOString();
    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    const upsertMany = db.transaction((entries: [string, string][]) => {
      for (const [key, value] of entries) {
        upsert.run(key, String(value), now);
      }
    });

    upsertMany(Object.entries(body));

    createAuditLog(
      admin.id, "update", "settings", null,
      { keys: Object.keys(body) },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
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
