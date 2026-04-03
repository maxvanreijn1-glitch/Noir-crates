import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: Promise<{ id: string }> };

function parseRole(role: Record<string, unknown>) {
  let permissions: string[] = [];
  try {
    permissions = JSON.parse(role.permissions as string) as string[];
  } catch {
    permissions = [];
  }
  return { ...role, permissions };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req, "admins:read");
    if (admin instanceof NextResponse) return admin;

    const { id } = await params;
    const role = db.prepare("SELECT * FROM admin_roles WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(parseRole(role));
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
    const existing = db.prepare("SELECT * FROM admin_roles WHERE id = ?").get(id);
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const body = await req.json() as { name?: string; permissions?: string[] };

    db.prepare(`
      UPDATE admin_roles SET
        name = COALESCE(?, name),
        permissions = COALESCE(?, permissions)
      WHERE id = ?
    `).run(
      body.name ?? null,
      body.permissions !== undefined ? JSON.stringify(body.permissions) : null,
      id,
    );

    createAuditLog(
      admin.id, "update", "role", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = db.prepare("SELECT * FROM admin_roles WHERE id = ?").get(id) as Record<string, unknown>;
    return NextResponse.json(parseRole(updated));
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
    const existing = db.prepare("SELECT * FROM admin_roles WHERE id = ?").get(id) as { name: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    if (existing.name === "super_admin") {
      return NextResponse.json({ error: "Cannot delete the super_admin role" }, { status: 403 });
    }

    db.prepare("DELETE FROM admin_roles WHERE id = ?").run(id);

    createAuditLog(
      admin.id, "delete", "role", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
