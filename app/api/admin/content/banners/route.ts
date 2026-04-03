import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "cms:read");
    if (admin instanceof NextResponse) return admin;

    const banners = await sql`SELECT * FROM cms_banners ORDER BY sort_order ASC`;
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

    const isActive = body.is_active !== undefined ? (body.is_active ? true : false) : true;

    const [banner] = await sql<[Record<string, unknown>]>`
      INSERT INTO cms_banners (title, subtitle, image_url, link_url, is_active, sort_order)
      VALUES (
        ${body.title as string},
        ${body.subtitle as string | null ?? null},
        ${body.image_url as string | null ?? null},
        ${body.link_url as string | null ?? null},
        ${isActive},
        ${body.sort_order as number ?? 0}
      )
      RETURNING *
    `;

    await createAuditLog(
      admin.id, "create", "cms_banner",
      banner.id as number,
      { title: body.title },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
