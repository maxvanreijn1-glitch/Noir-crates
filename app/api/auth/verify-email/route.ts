import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { Customer } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const rows = await sql<Customer[]>`
      SELECT * FROM customers WHERE email_verify_token = ${token} LIMIT 1
    `;
    const customer = rows[0];

    if (!customer) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    await sql`
      UPDATE customers SET email_verified = TRUE, email_verify_token = NULL, updated_at = NOW()
      WHERE id = ${customer.id}
    `;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/account?verified=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
