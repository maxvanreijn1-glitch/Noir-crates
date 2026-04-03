import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "cms:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM cms_banners WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const isActive = body.is_active !== undefined ? (body.is_active ? true : false) : null;

    await sql`
      UPDATE cms_banners SET
        title = COALESCE(${body.title as string | null ?? null}, title),
        subtitle = COALESCE(${body.subtitle as string | null ?? null}, subtitle),
        image_url = COALESCE(${body.image_url as string | null ?? null}, image_url),
        link_url = COALESCE(${body.link_url as string | null ?? null}, link_url),
        is_active = COALESCE(${isActive}, is_active),
        sort_order = COALESCE(${body.sort_order as number | null ?? null}, sort_order),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "cms_banner", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql`SELECT * FROM cms_banners WHERE id = ${id}`;
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
    const existing = await sql`SELECT id FROM cms_banners WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    await sql`DELETE FROM cms_banners WHERE id = ${id}`;

    await createAuditLog(
      admin.id, "delete", "cms_banner", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
