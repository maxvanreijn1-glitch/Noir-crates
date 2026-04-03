import { NextRequest, NextResponse } from "next/server";
import { sql, createAuditLog } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req, "admins:read");
    if (admin instanceof NextResponse) return admin;

    const roles = await sql<Record<string, unknown>[]>`SELECT * FROM admin_roles ORDER BY id ASC`;
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

    const [role] = await sql<[Record<string, unknown>]>`
      INSERT INTO admin_roles (name, permissions) VALUES (${body.name}, ${JSON.stringify(body.permissions ?? [])})
      RETURNING *
    `;

    let permissions: string[] = [];
    try {
      permissions = JSON.parse(role.permissions as string) as string[];
    } catch {
      permissions = [];
    }

    await createAuditLog(
      admin.id, "create", "role",
      role.id as number,
      { name: body.name },
      req.headers.get("x-forwarded-for") ?? ""
    );

    return NextResponse.json({ ...role, permissions }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
