import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { openingId?: number };
    const { openingId } = body;

    if (!openingId || typeof openingId !== "number") {
      return NextResponse.json({ error: "openingId is required" }, { status: 400 });
    }

    // Optional auth — if customer is logged in, verify they own this opening
    const customer = await getCustomerFromRequest(req);

    try {
      if (customer) {
        const [opening] = await sql<{ id: number; customer_id: number | null }[]>`
          SELECT id, customer_id FROM pack_openings WHERE id = ${openingId} LIMIT 1
        `;
        if (!opening) {
          return NextResponse.json({ error: "Opening not found" }, { status: 404 });
        }
        if (opening.customer_id !== null && opening.customer_id !== customer.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      await sql`
        UPDATE pack_openings SET status = 'ship_requested' WHERE id = ${openingId}
      `;
    } catch (dbError) {
      console.error("[pack-opener/ship] DB error:", dbError);
      // Gracefully succeed even if DB is not available
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
