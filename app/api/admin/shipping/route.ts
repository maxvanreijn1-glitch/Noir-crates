import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

function parseCountries(raw: unknown): string[] {
  try {
    return JSON.parse(raw as string) as string[];
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "shipping:read");
    if (admin instanceof NextResponse) return admin;

    const zones = db.prepare("SELECT * FROM shipping_zones ORDER BY id DESC").all() as Record<string, unknown>[];
    const result = zones.map((zone) => {
      const rates = db.prepare("SELECT * FROM shipping_rates WHERE zone_id = ?").all(zone.id as number);
      return { ...zone, countries: parseCountries(zone.countries), rates };
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "shipping:write");
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as { name?: string; countries?: string[] };
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO shipping_zones (name, countries) VALUES (?, ?)
    `).run(body.name, JSON.stringify(body.countries ?? []));

    const zone = db.prepare("SELECT * FROM shipping_zones WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;

    createAuditLog(
      admin.id, "create", "shipping_zone",
      result.lastInsertRowid as number,
      { name: body.name },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ ...zone, countries: parseCountries(zone.countries) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
