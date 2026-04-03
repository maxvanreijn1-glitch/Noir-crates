import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

function parseZone(zone: Record<string, unknown>) {
  let countries: string[] = [];
  try {
    countries = JSON.parse(zone.countries as string) as string[];
  } catch {
    countries = [];
  }
  return { ...zone, countries };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "shipping:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const zones = await sql<Record<string, unknown>[]>`SELECT * FROM shipping_zones WHERE id = ${id}`;
    if (zones.length === 0) {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
    }

    const rates = await sql`SELECT * FROM shipping_rates WHERE zone_id = ${id}`;
    return NextResponse.json({ ...parseZone(zones[0]), rates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "shipping:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM shipping_zones WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const countriesJson = body.countries !== undefined ? JSON.stringify(body.countries) : null;

    await sql`
      UPDATE shipping_zones SET
        name = COALESCE(${body.name as string | null ?? null}, name),
        countries = COALESCE(${countriesJson}, countries)
      WHERE id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "shipping_zone", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql<Record<string, unknown>[]>`SELECT * FROM shipping_zones WHERE id = ${id}`;
    const rates = await sql`SELECT * FROM shipping_rates WHERE zone_id = ${id}`;
    return NextResponse.json({ ...parseZone(updated[0]), rates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "shipping:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM shipping_zones WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
    }

    await sql`DELETE FROM shipping_zones WHERE id = ${id}`;

    await createAuditLog(
      admin.id, "delete", "shipping_zone", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "shipping:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM shipping_zones WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    if (body.action !== "add_rate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!body.name || body.price_cents === undefined) {
      return NextResponse.json({ error: "name and price_cents are required" }, { status: 400 });
    }

    const [rate] = await sql<[Record<string, unknown>]>`
      INSERT INTO shipping_rates (zone_id, name, price_cents, estimated_days_min, estimated_days_max)
      VALUES (
        ${id},
        ${body.name as string},
        ${body.price_cents as number},
        ${body.estimated_days_min as number ?? 1},
        ${body.estimated_days_max as number ?? 7}
      )
      RETURNING *
    `;
    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
