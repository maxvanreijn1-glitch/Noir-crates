import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

const SAFE_COLUMNS = "id, email, name, role, is_active, created_at, updated_at";

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "admins:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const user = db.prepare(`SELECT ${SAFE_COLUMNS} FROM admin_users WHERE id = ?`).get(id);
    if (!user) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }
    return NextResponse.json(user);
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
    const existing = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const body = await req.json() as Record<string, unknown>;
    const now = new Date().toISOString();

    let roleName: string | null = null;
    if (body.role_id !== undefined) {
      const roleRow = db.prepare("SELECT name FROM admin_roles WHERE id = ?").get(body.role_id) as { name: string } | undefined;
      if (!roleRow) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 });
      }
      roleName = roleRow.name;
    } else if (body.role !== undefined) {
      roleName = body.role as string;
    }

    let passwordHash: string | null = null;
    if (body.password) {
      passwordHash = await bcrypt.hash(body.password as string, 12);
    }

    db.prepare(`
      UPDATE admin_users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        role = COALESCE(?, role),
        is_active = COALESCE(?, is_active),
        password_hash = COALESCE(?, password_hash),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.name ?? null,
      body.email ?? null,
      roleName,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : null,
      passwordHash,
      now,
      id,
    );

    createAuditLog(
      admin.id, "update", "admin_user", id,
      { name: body.name, email: body.email, role: roleName, is_active: body.is_active },
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare(`SELECT ${SAFE_COLUMNS} FROM admin_users WHERE id = ?`).get(id);
    return NextResponse.json(updated);
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

    const existing = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM admin_users WHERE id = ?").run(id);

    createAuditLog(
      admin.id, "delete", "admin_user", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
