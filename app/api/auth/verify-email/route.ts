import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Customer } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const customer = db
      .prepare("SELECT * FROM customers WHERE email_verify_token = ? LIMIT 1")
      .get(token) as Customer | undefined;

    if (!customer) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    db.prepare(`
      UPDATE customers SET email_verified = 1, email_verify_token = NULL, updated_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), customer.id);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/account?verified=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
