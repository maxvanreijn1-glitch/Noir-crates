import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = 30;
    const offset = (page - 1) * limit;

    try {
      const [countRow] = await sql<{ count: string }[]>`
        SELECT COUNT(*) as count FROM pack_openings
      `;
      const total = parseInt(countRow?.count ?? "0", 10);

      const openings = await sql<{
        id: number;
        session_id: string;
        customer_id: number | null;
        tcg_name: string;
        set_name: string;
        status: string;
        created_at: string;
        customer_email: string | null;
      }[]>`
        SELECT po.id, po.session_id, po.customer_id, po.tcg_name, po.set_name, po.status, po.created_at,
               c.email as customer_email
        FROM pack_openings po
        LEFT JOIN customers c ON c.id = po.customer_id
        ORDER BY po.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const results = await Promise.all(
        openings.map(async o => {
          const cards = await sql<{
            card_name: string;
            card_image: string;
            card_rarity: string;
            card_set: string;
            position: number;
          }[]>`
            SELECT card_name, card_image, card_rarity, card_set, position
            FROM pack_opening_cards
            WHERE opening_id = ${o.id}
            ORDER BY position ASC
          `;
          return { ...o, cards };
        })
      );

      return NextResponse.json({ data: results, total, pages: Math.ceil(total / limit) });
    } catch (dbError) {
      console.error("[admin/pack-opener GET] DB error:", dbError);
      return NextResponse.json({ data: [], total: 0, pages: 1 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as { action?: string; openingId?: number };
    const { action, openingId } = body;

    if (action !== "ship" || !openingId) {
      return NextResponse.json({ error: "Invalid action or missing openingId" }, { status: 400 });
    }

    try {
      await sql`
        UPDATE pack_openings SET status = 'shipped' WHERE id = ${openingId}
      `;
    } catch (dbError) {
      console.error("[admin/pack-opener POST] DB error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
