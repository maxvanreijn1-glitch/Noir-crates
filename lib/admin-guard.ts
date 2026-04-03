import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { db, getAdminById } from "@/lib/db";
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
    const adminUser = getAdminById(adminPayload.id);
    if (!adminUser || !adminUser.is_active) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up role permissions from the database
    const roleRow = db
      .prepare(`SELECT permissions FROM admin_roles WHERE name = ? LIMIT 1`)
      .get(adminUser.role) as Pick<AdminRole, "permissions"> | undefined;

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
