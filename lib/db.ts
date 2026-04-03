import sql from "./postgres";

export { sql };

// ---------------------------------------------------------------------------
// Types  (same shapes as before so routes need minimal changes)
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminRole {
  id: number;
  name: string;
  permissions: string; // JSON array stored as text
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  pages: number;
}

export interface Customer {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  password_hash: string | null;
  email_verified: boolean;
  email_verify_token: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
  is_banned: boolean;
  ban_reason: string | null;
  stripe_customer_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Helper functions (all async now)
// ---------------------------------------------------------------------------

export async function getAdminByEmail(email: string): Promise<AdminUser | undefined> {
  const rows = await sql<AdminUser[]>`SELECT * FROM admin_users WHERE email = ${email} LIMIT 1`;
  return rows[0];
}

export async function getAdminById(id: number): Promise<AdminUser | undefined> {
  const rows = await sql<AdminUser[]>`SELECT * FROM admin_users WHERE id = ${id} LIMIT 1`;
  return rows[0];
}

export async function createAuditLog(
  adminId: number,
  action: string,
  resourceType: string,
  resourceId: string | number | null,
  details: object,
  ip: string
): Promise<void> {
  await sql`
    INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, details, ip_address)
    VALUES (${adminId}, ${action}, ${resourceType}, ${resourceId !== null ? String(resourceId) : null}, ${JSON.stringify(details)}, ${ip})
  `;
}

export async function getCustomerByEmail(email: string): Promise<Customer | undefined> {
  const rows = await sql<Customer[]>`SELECT * FROM customers WHERE email = ${email} LIMIT 1`;
  return rows[0];
}

export async function getCustomerById(id: number): Promise<Customer | undefined> {
  const rows = await sql<Customer[]>`SELECT * FROM customers WHERE id = ${id} LIMIT 1`;
  return rows[0];
}
