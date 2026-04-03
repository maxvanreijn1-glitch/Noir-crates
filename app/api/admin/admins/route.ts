import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "admins:read");
    if (admin instanceof NextResponse) return admin;

    const admins = db.prepare(
      "SELECT id, email, name, role, is_active, created_at, updated_at FROM admin_users ORDER BY id DESC"
    ).all();
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
      const roleRow = db.prepare("SELECT name FROM admin_roles WHERE id = ?").get(role_id) as { name: string } | undefined;
      if (!roleRow) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 });
      }
      roleName = roleRow.name;
    }

    const passwordHash = await bcrypt.hash(password as string, 12);

    const result = db.prepare(`
      INSERT INTO admin_users (email, password_hash, name, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(email, passwordHash, name, roleName);

    const created = db.prepare(
      "SELECT id, email, name, role, is_active, created_at, updated_at FROM admin_users WHERE id = ?"
    ).get(result.lastInsertRowid);

    createAuditLog(
      admin.id, "create", "admin_user",
      result.lastInsertRowid as number,
      { email, name, role: roleName },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
