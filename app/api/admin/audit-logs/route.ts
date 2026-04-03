import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "reports:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;
    const adminIdParam = searchParams.get("admin_id") ?? "";
    const resourceType = searchParams.get("resource_type") ?? "";

    let data, countResult;

    if (adminIdParam && resourceType) {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM audit_logs WHERE admin_id = ${adminIdParam} AND resource_type = ${resourceType}`;
      data = await sql`SELECT * FROM audit_logs WHERE admin_id = ${adminIdParam} AND resource_type = ${resourceType} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (adminIdParam) {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM audit_logs WHERE admin_id = ${adminIdParam}`;
      data = await sql`SELECT * FROM audit_logs WHERE admin_id = ${adminIdParam} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (resourceType) {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM audit_logs WHERE resource_type = ${resourceType}`;
      data = await sql`SELECT * FROM audit_logs WHERE resource_type = ${resourceType} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM audit_logs`;
      data = await sql`SELECT * FROM audit_logs ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    }

    const total = parseInt(countResult[0].count);
    return NextResponse.json({ data, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
