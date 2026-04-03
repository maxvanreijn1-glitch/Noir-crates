import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "customers:read");
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") ?? "";
    const banned = searchParams.get("banned") ?? "";

    let data, countResult;

    if (search && banned !== "") {
      const bannedVal = banned === "true";
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM customers WHERE (email ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'}) AND is_banned = ${bannedVal}`;
      data = await sql`SELECT * FROM customers WHERE (email ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'}) AND is_banned = ${bannedVal} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (search) {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM customers WHERE email ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'}`;
      data = await sql`SELECT * FROM customers WHERE email ILIKE ${'%' + search + '%'} OR name ILIKE ${'%' + search + '%'} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (banned !== "") {
      const bannedVal = banned === "true";
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM customers WHERE is_banned = ${bannedVal}`;
      data = await sql`SELECT * FROM customers WHERE is_banned = ${bannedVal} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    } else {
      countResult = await sql<[{ count: string }]>`SELECT COUNT(*) as count FROM customers`;
      data = await sql`SELECT * FROM customers ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`;
    }

    const total = parseInt(countResult[0].count);
    return NextResponse.json({ data, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
