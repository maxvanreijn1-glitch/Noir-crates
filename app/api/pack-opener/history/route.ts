import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: NextRequest) {
  try {
    const customer = await requireCustomer(req);
    if (customer instanceof NextResponse) return customer;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
      const [countRow] = await sql<{ count: string }[]>`
        SELECT COUNT(*) as count FROM pack_openings WHERE customer_id = ${customer.id}
      `;
      const total = parseInt(countRow?.count ?? "0", 10);

      const openings = await sql<{
        id: number;
        tcg_name: string;
        set_name: string;
        status: string;
        created_at: string;
      }[]>`
        SELECT id, tcg_name, set_name, status, created_at
        FROM pack_openings
        WHERE customer_id = ${customer.id}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      // Get cards for each opening
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

      return NextResponse.json({
        data: results,
        total,
        pages: Math.ceil(total / limit),
      });
    } catch (dbError) {
      console.error("[pack-history] DB error:", dbError);
      return NextResponse.json({ data: [], total: 0, pages: 1 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
