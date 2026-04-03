import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "admins:read");
    if (admin instanceof NextResponse) return admin;

    const admins = await sql`
      SELECT id, email, name, role, is_active, created_at, updated_at FROM admin_users ORDER BY id DESC
    `;
    return NextResponse.json({ data: admins });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "admins:write");
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as Record<string, unknown>;
    const { email, password, name, role_id } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, name" },
        { status: 400 }
      );
    }

    let roleName = "admin";
    if (role_id) {
      const roles = await sql<{ name: string }[]>`SELECT name FROM admin_roles WHERE id = ${role_id as number}`;
      if (roles.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 });
      }
      roleName = roles[0].name;
    }

    const passwordHash = await bcrypt.hash(password as string, 12);

    const [created] = await sql<[Record<string, unknown>]>`
      INSERT INTO admin_users (email, password_hash, name, role, is_active)
      VALUES (${email as string}, ${passwordHash}, ${name as string}, ${roleName}, TRUE)
      RETURNING id, email, name, role, is_active, created_at, updated_at
    `;

    await createAuditLog(
      admin.id, "create", "admin_user",
      created.id as number,
      { email, name, role: roleName },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
