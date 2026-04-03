import { NextRequest, NextResponse } from "next/server";
import { paginatedQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "reports:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const adminIdParam = searchParams.get("admin_id") ?? "";
    const resourceType = searchParams.get("resource_type") ?? "";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (adminIdParam) {
      conditions.push("admin_id = ?");
      params.push(adminIdParam);
    }
    if (resourceType) {
      conditions.push("resource_type = ?");
      params.push(resourceType);
    }

    const where = conditions.join(" AND ");
    const result = paginatedQuery("audit_logs", where, params, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
