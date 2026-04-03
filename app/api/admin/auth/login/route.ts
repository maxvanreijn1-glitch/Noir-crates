import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminByEmail, createAuditLog } from "@/lib/db";
import { signAdminToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const admin = await getAdminByEmail(email);

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { error: "Account is disabled" },
        { status: 401 }
      );
    }

    const token = await signAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    await createAuditLog(admin.id, "login", "admin_user", admin.id, {}, ip);

    const response = NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
