import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "cms:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = db.prepare("SELECT * FROM cms_pages WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE cms_pages SET
        slug = COALESCE(?, slug),
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        is_published = COALESCE(?, is_published),
        meta_description = COALESCE(?, meta_description),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.slug ?? null,
      body.title ?? null,
      body.content ?? null,
      body.is_published !== undefined ? (body.is_published ? 1 : 0) : null,
      body.meta_description ?? null,
      now,
      id,
    );

    createAuditLog(
      admin.id, "update", "cms_page", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare("SELECT * FROM cms_pages WHERE id = ?").get(id);
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
    const existing = db.prepare("SELECT * FROM cms_pages WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM cms_pages WHERE id = ?").run(id);

    createAuditLog(
      admin.id, "delete", "cms_page", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
