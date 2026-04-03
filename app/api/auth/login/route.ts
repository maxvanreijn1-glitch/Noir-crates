import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCustomerByEmail } from "@/lib/db";
import { signCustomerToken } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const customer = getCustomerByEmail(email);
    if (!customer || !customer.password_hash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, customer.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (customer.is_banned) {
      return NextResponse.json(
        { error: "Account suspended", reason: customer.ban_reason },
        { status: 403 }
      );
    }

    const token = await signCustomerToken({ id: customer.id, email: customer.email });

    const response = NextResponse.json({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      email_verified: customer.email_verified,
    });
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
