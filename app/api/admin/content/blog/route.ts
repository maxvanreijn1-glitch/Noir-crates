import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "cms:read");
    if (admin instanceof NextResponse) return admin;

    const posts = await sql`SELECT * FROM cms_blog_posts ORDER BY id DESC`;
    return NextResponse.json({ data: posts });
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

    const isPublished = body.is_published ? true : false;

    const [post] = await sql<[Record<string, unknown>]>`
      INSERT INTO cms_blog_posts (slug, title, content, excerpt, image_url, is_published, author_id)
      VALUES (
        ${body.slug as string},
        ${body.title as string},
        ${body.content as string | null ?? null},
        ${body.excerpt as string | null ?? null},
        ${body.image_url as string | null ?? null},
        ${isPublished},
        ${admin.id}
      )
      RETURNING *
    `;

    await createAuditLog(
      admin.id, "create", "cms_blog_post",
      post.id as number,
      { slug: body.slug, title: body.title },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
