import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "payments:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;
    const status = searchParams.get("status") ?? "";
    const fraud_flag = searchParams.get("fraud_flag") ?? "";

    let data, countResult;

    if (status && fraud_flag !== "") {
      const fraudVal = fraud_flag === "true";
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM payments WHERE status = ${status} AND fraud_flag = ${fraudVal}`;
      data = await sql`SELECT * FROM payments WHERE status = ${status} AND fraud_flag = ${fraudVal} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (status) {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM payments WHERE status = ${status}`;
      data = await sql`SELECT * FROM payments WHERE status = ${status} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (fraud_flag !== "") {
      const fraudVal = fraud_flag === "true";
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM payments WHERE fraud_flag = ${fraudVal}`;
      data = await sql`SELECT * FROM payments WHERE fraud_flag = ${fraudVal} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM payments`;
      data = await sql`SELECT * FROM payments ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    }

    const total = parseInt(countResult[0].count);
    return NextResponse.json({ data, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
