import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCustomerByEmail, db } from "@/lib/db";
import { sendEmail, passwordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string };
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const customer = getCustomerByEmail(email);
    // Always return success to prevent email enumeration
    if (!customer) {
      return NextResponse.json({ ok: true });
    }

    const reset_token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE customers SET reset_token = ?, reset_token_expires = ?, updated_at = ?
      WHERE id = ?
    `).run(reset_token, expires, new Date().toISOString(), customer.id);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/account/reset-password?token=${reset_token}`;
    const emailOpts = passwordResetEmail({ resetUrl, to: email });
    await sendEmail(emailOpts);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
