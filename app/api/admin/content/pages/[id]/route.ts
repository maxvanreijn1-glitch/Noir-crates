import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "cms:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM cms_pages WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const isPublished = body.is_published !== undefined ? (body.is_published ? true : false) : null;

    await sql`
      UPDATE cms_pages SET
        slug = COALESCE(${body.slug as string | null ?? null}, slug),
        title = COALESCE(${body.title as string | null ?? null}, title),
        content = COALESCE(${body.content as string | null ?? null}, content),
        is_published = COALESCE(${isPublished}, is_published),
        meta_description = COALESCE(${body.meta_description as string | null ?? null}, meta_description),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "cms_page", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql`SELECT * FROM cms_pages WHERE id = ${id}`;
    return NextResponse.json(updated[0]);
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
    const existing = await sql`SELECT id FROM cms_pages WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    await sql`DELETE FROM cms_pages WHERE id = ${id}`;

    await createAuditLog(
      admin.id, "delete", "cms_page", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
