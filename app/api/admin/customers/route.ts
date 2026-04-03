import { NextRequest, NextResponse } from "next/server";
import { paginatedQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "customers:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const search = searchParams.get("search") ?? "";
    const banned = searchParams.get("banned") ?? "";

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      conditions.push("(email LIKE ? OR name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (banned !== "") {
      conditions.push("is_banned = ?");
      params.push(banned === "true" ? 1 : 0);
    }

    const where = conditions.join(" AND ");
    const result = paginatedQuery("customers", where, params, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
