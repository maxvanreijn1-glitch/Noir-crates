import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "cms:read");
    if (admin instanceof NextResponse) return admin;

    const pages = await sql`SELECT * FROM cms_pages ORDER BY id DESC`;
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

    const isPublished = body.is_published ? true : false;

    const [page] = await sql<[Record<string, unknown>]>`
      INSERT INTO cms_pages (slug, title, content, is_published, meta_description)
      VALUES (
        ${body.slug as string},
        ${body.title as string},
        ${body.content as string | null ?? null},
        ${isPublished},
        ${body.meta_description as string | null ?? null}
      )
      RETURNING *
    `;

    await createAuditLog(
      admin.id, "create", "cms_page",
      page.id as number,
      { slug: body.slug, title: body.title },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
