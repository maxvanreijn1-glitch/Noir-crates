import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { sql, getAdminById } from "@/lib/db";
import type { AdminRole } from "@/lib/db";

export async function requireAdmin(
  req: NextRequest,
  requiredPermission?: string
): Promise<{ id: number; email: string; role: string } | NextResponse> {
  const adminPayload = await getAdminFromRequest(req);

  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (requiredPermission) {
    const adminUser = await getAdminById(adminPayload.id);
    if (!adminUser || !adminUser.is_active) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleRows = await sql<Pick<AdminRole, "permissions">[]>`
      SELECT permissions FROM admin_roles WHERE name = ${adminUser.role} LIMIT 1
    `;
    const roleRow = roleRows[0];

    if (!roleRow) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let permissions: string[] = [];
    try {
      permissions = JSON.parse(roleRow.permissions) as string[];
    } catch {
      permissions = [];
    }

    if (!permissions.includes(requiredPermission)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return adminPayload;
}
