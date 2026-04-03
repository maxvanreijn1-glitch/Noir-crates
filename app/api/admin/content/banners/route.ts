import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "cms:read");
    if (admin instanceof NextResponse) return admin;

    const banners = db.prepare("SELECT * FROM cms_banners ORDER BY sort_order ASC").all();
    return NextResponse.json({ data: banners });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "cms:write");
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as Record<string, unknown>;
    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO cms_banners (title, subtitle, image_url, link_url, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      body.title,
      body.subtitle ?? null,
      body.image_url ?? null,
      body.link_url ?? null,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      body.sort_order ?? 0,
    );

    const banner = db.prepare("SELECT * FROM cms_banners WHERE id = ?").get(result.lastInsertRowid);

    createAuditLog(
      admin.id, "create", "cms_banner",
      result.lastInsertRowid as number,
      { title: body.title },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
