import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
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
    const roles = await sql<Record<string, unknown>[]>`SELECT * FROM admin_roles WHERE id = ${id}`;
    if (roles.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    return NextResponse.json(parseRole(roles[0]));
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
    const existing = await sql`SELECT id FROM admin_roles WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const body = await req.json() as { name?: string; permissions?: string[] };
    const permissionsJson = body.permissions !== undefined ? JSON.stringify(body.permissions) : null;

    await sql`
      UPDATE admin_roles SET
        name = COALESCE(${body.name as string | null ?? null}, name),
        permissions = COALESCE(${permissionsJson}, permissions)
      WHERE id = ${id}
    `;

    await createAuditLog(
      admin.id, "update", "role", id,
      body as object,
      req.headers.get("x-forwarded-for") ?? ""
    );

    const updated = await sql<Record<string, unknown>[]>`SELECT * FROM admin_roles WHERE id = ${id}`;
    return NextResponse.json(parseRole(updated[0]));
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
    const existing = await sql<{ name: string }[]>`SELECT name FROM admin_roles WHERE id = ${id}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    if (existing[0].name === "super_admin") {
      return NextResponse.json({ error: "Cannot delete the super_admin role" }, { status: 403 });
    }

    await sql`DELETE FROM admin_roles WHERE id = ${id}`;

    await createAuditLog(
      admin.id, "delete", "role", id, {},
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
