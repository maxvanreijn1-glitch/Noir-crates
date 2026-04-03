import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
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

    const customer = db
      .prepare("SELECT * FROM customers WHERE reset_token = ? LIMIT 1")
      .get(token) as Customer | undefined;

    if (!customer || !customer.reset_token_expires) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (new Date(customer.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    db.prepare(`
      UPDATE customers
      SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = ?
      WHERE id = ?
    `).run(password_hash, new Date().toISOString(), customer.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
