import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
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

    const zones = await sql<Record<string, unknown>[]>`SELECT * FROM shipping_zones ORDER BY id DESC`;
    const result = await Promise.all(zones.map(async (zone) => {
      const rates = await sql`SELECT * FROM shipping_rates WHERE zone_id = ${zone.id as number}`;
      return { ...zone, countries: parseCountries(zone.countries), rates };
    }));

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

    const [zone] = await sql<[Record<string, unknown>]>`
      INSERT INTO shipping_zones (name, countries) VALUES (${body.name}, ${JSON.stringify(body.countries ?? [])})
      RETURNING *
    `;

    await createAuditLog(
      admin.id, "create", "shipping_zone",
      zone.id as number,
      { name: body.name },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ ...zone, countries: parseCountries(zone.countries) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
