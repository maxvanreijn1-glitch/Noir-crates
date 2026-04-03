import { NextRequest, NextResponse } from "next/server";
import { db, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "admins:read");
    if (admin instanceof NextResponse) return admin;

    const roles = db.prepare("SELECT * FROM admin_roles ORDER BY id ASC").all() as Record<string, unknown>[];
    const parsed = roles.map((role) => {
      let permissions: string[] = [];
      try {
        permissions = JSON.parse(role.permissions as string) as string[];
      } catch {
        permissions = [];
      }
      return { ...role, permissions };
    });

    return NextResponse.json({ data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "admins:write");
    if (admin instanceof NextResponse) return admin;

    const body = await req.json() as { name?: string; permissions?: string[] };
    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO admin_roles (name, permissions) VALUES (?, ?)
    `).run(body.name, JSON.stringify(body.permissions ?? []));

    const role = db.prepare("SELECT * FROM admin_roles WHERE id = ?").get(result.lastInsertRowid) as Record<string, unknown>;
    let permissions: string[] = [];
    try {
      permissions = JSON.parse(role.permissions as string) as string[];
    } catch {
      permissions = [];
    }

    createAuditLog(
      admin.id, "create", "role",
      result.lastInsertRowid as number,
      { name: body.name },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ ...role, permissions }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
