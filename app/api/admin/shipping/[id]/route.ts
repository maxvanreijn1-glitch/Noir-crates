import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
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
    const zone = db.prepare("SELECT * FROM shipping_zones WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!zone) {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
    }

    const rates = db.prepare("SELECT * FROM shipping_rates WHERE zone_id = ?").all(id);
    return NextResponse.json({ ...parseZone(zone), rates });
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
    const existing = db.prepare("SELECT * FROM shipping_zones WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;

    db.prepare(`
      UPDATE shipping_zones SET
        name = COALESCE(?, name),
        countries = COALESCE(?, countries)
      WHERE id = ?
    `).run(
      body.name ?? null,
      body.countries !== undefined ? JSON.stringify(body.countries) : null,
      id,
    );

    createAuditLog(
      admin.id, "update", "shipping_zone", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare("SELECT * FROM shipping_zones WHERE id = ?").get(id) as Record<string, unknown>;
    const rates = db.prepare("SELECT * FROM shipping_rates WHERE zone_id = ?").all(id);
    return NextResponse.json({ ...parseZone(updated), rates });
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
    const existing = db.prepare("SELECT * FROM shipping_zones WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM shipping_zones WHERE id = ?").run(id);

    createAuditLog(
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
    const existing = db.prepare("SELECT * FROM shipping_zones WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Shipping zone not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    if (body.action !== "add_rate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!body.name || body.price_cents === undefined) {
      return NextResponse.json({ error: "name and price_cents are required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO shipping_rates (zone_id, name, price_cents, estimated_days_min, estimated_days_max)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      body.name,
      body.price_cents,
      body.estimated_days_min ?? 1,
      body.estimated_days_max ?? 7,
    );

    const rate = db.prepare("SELECT * FROM shipping_rates WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
