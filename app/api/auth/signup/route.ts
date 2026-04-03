import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sql, getCustomerByEmail } from "@/lib/db";
import { signCustomerToken } from "@/lib/customer-auth";
import { sendEmail, emailVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { name, email, password } = body as { name?: string; email?: string; password?: string };

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await getCustomerByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const email_verify_token = crypto.randomBytes(32).toString("hex");

    const [inserted] = await sql<[{ id: number }]>`
      INSERT INTO customers (email, name, password_hash, email_verified, email_verify_token)
      VALUES (${email}, ${name ?? null}, ${password_hash}, FALSE, ${email_verify_token})
      RETURNING id
    `;
    const customerId = inserted.id;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${email_verify_token}`;
    const emailOpts = emailVerificationEmail({ verifyUrl, to: email });
    await sendEmail(emailOpts);

    const token = await signCustomerToken({ id: customerId, email });

    const response = NextResponse.json(
      { id: customerId, email, name: name ?? null, email_verified: false },
      { status: 201 }
    );
    response.cookies.set("customer_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
