import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "admins:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const users = await sql`SELECT id, email, name, role, is_active, created_at, updated_at FROM admin_users WHERE id = ${id}`;
    if (users.length === 0) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }
    return NextResponse.json(users[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "admins:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const existing = await sql`SELECT id FROM admin_users WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;

    let roleName: string | null = null;
    if (body.role_id !== undefined) {
      const roles = await sql<{ name: string }[]>`SELECT name FROM admin_roles WHERE id = ${body.role_id as number}`;
      if (roles.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 });
      }
      roleName = roles[0].name;
    } else if (body.role !== undefined) {
      roleName = body.role as string;
    }

    let passwordHash: string | null = null;
    if (body.password) {
      passwordHash = await bcrypt.hash(body.password as string, 12);
    }

    const isActive = body.is_active !== undefined ? (body.is_active ? true : false) : null;

    await sql`
      UPDATE admin_users SET
        name = COALESCE(${body.name as string | null ?? null}, name),
        email = COALESCE(${body.email as string | null ?? null}, email),
        role = COALESCE(${roleName}, role),
        is_active = COALESCE(${isActive}, is_active),
        password_hash = COALESCE(${passwordHash}, password_hash),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "admin_user", id,
      { name: body.name, email: body.email, role: roleName, is_active: body.is_active },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql`SELECT id, email, name, role, is_active, created_at, updated_at FROM admin_users WHERE id = ${id}`;
    return NextResponse.json(updated[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "admins:write");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    if (String(id) === String(admin.id)) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const existing = await sql`SELECT id FROM admin_users WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    await sql`DELETE FROM admin_users WHERE id = ${id}`;

    await createAuditLog(
      admin.id, "delete", "admin_user", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
