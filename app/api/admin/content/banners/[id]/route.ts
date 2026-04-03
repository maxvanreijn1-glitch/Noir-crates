import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "cms:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = db.prepare("SELECT * FROM cms_banners WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE cms_banners SET
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        image_url = COALESCE(?, image_url),
        link_url = COALESCE(?, link_url),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.title ?? null,
      body.subtitle ?? null,
      body.image_url ?? null,
      body.link_url ?? null,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : null,
      body.sort_order ?? null,
      now,
      id,
    );

    createAuditLog(
      admin.id, "update", "cms_banner", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare("SELECT * FROM cms_banners WHERE id = ?").get(id);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "cms:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = db.prepare("SELECT * FROM cms_banners WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM cms_banners WHERE id = ?").run(id);

    createAuditLog(
      admin.id, "delete", "cms_banner", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
