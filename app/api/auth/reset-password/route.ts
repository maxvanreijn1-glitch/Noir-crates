import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import type { Customer } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { token?: string; password?: string };
    const { token, password } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const rows = await sql<Customer[]>`
      SELECT * FROM customers WHERE reset_token = ${token} LIMIT 1
    `;
    const customer = rows[0];

    if (!customer || !customer.reset_token_expires) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (new Date(customer.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    await sql`
      UPDATE customers
      SET password_hash = ${password_hash}, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
      WHERE id = ${customer.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
