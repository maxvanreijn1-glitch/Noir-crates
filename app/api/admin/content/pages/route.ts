import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "cms:read");
    if (admin instanceof NextResponse) return admin;

    const pages = db.prepare("SELECT * FROM cms_pages ORDER BY id DESC").all();
    return NextResponse.json({ data: pages });
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
    if (!body.slug || !body.title) {
      return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO cms_pages (slug, title, content, is_published, meta_description)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      body.slug,
      body.title,
      body.content ?? null,
      body.is_published ? 1 : 0,
      body.meta_description ?? null,
    );

    const page = db.prepare("SELECT * FROM cms_pages WHERE id = ?").get(result.lastInsertRowid);

    createAuditLog(
      admin.id, "create", "cms_page",
      result.lastInsertRowid as number,
      { slug: body.slug, title: body.title },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
