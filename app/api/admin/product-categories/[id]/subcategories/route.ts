import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "products:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;

    const category = await sql`SELECT id FROM product_categories WHERE id = ${id}`;
    if (category.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const subcategories = await sql`
      SELECT id, category_id, name, slug, description, created_at
      FROM product_subcategories
      WHERE category_id = ${id}
      ORDER BY name ASC
    `;

    return NextResponse.json(subcategories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "products:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;

    const category = await sql`SELECT id FROM product_categories WHERE id = ${id}`;
    if (category.length === 0) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug" },
        { status: 400 }
      );
    }

    const [subcategory] = await sql<[Record<string, unknown>]>`
      INSERT INTO product_subcategories (category_id, name, slug, description)
      VALUES (${id}, ${name as string}, ${slug as string}, ${description as string | null ?? null})
      RETURNING *
    `;

    return NextResponse.json(subcategory, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
