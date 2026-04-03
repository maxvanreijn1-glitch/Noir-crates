import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "cms:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM cms_blog_posts WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const isPublished = body.is_published !== undefined ? (body.is_published ? true : false) : null;

    await sql`
      UPDATE cms_blog_posts SET
        slug = COALESCE(${body.slug as string | null ?? null}, slug),
        title = COALESCE(${body.title as string | null ?? null}, title),
        content = COALESCE(${body.content as string | null ?? null}, content),
        excerpt = COALESCE(${body.excerpt as string | null ?? null}, excerpt),
        image_url = COALESCE(${body.image_url as string | null ?? null}, image_url),
        is_published = COALESCE(${isPublished}, is_published),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "cms_blog_post", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql`SELECT * FROM cms_blog_posts WHERE id = ${id}`;
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
    const existing = await sql`SELECT id FROM cms_blog_posts WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    await sql`DELETE FROM cms_blog_posts WHERE id = ${id}`;

    await createAuditLog(
      admin.id, "delete", "cms_blog_post", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
