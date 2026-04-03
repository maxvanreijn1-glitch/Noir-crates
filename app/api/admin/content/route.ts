import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "cms:read");
    if (admin instanceof NextResponse) return admin;

    const banners = db.prepare("SELECT * FROM cms_banners ORDER BY sort_order ASC").all();
    const pages = db.prepare("SELECT * FROM cms_pages ORDER BY id DESC").all();
    const blog_posts = db.prepare("SELECT * FROM cms_blog_posts ORDER BY id DESC").all();

    return NextResponse.json({ banners, pages, blog_posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
