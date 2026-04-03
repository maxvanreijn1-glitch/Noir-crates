import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, getCustomerById } from "@/lib/db";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  const data = await getCustomerById(customer.id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    email_verified: data.email_verified,
    created_at: data.created_at,
  });
}

export async function PUT(req: NextRequest) {
  const customer = await requireCustomer(req);
  if (customer instanceof NextResponse) return customer;

  try {
    const body = await req.json() as Record<string, unknown>;

    if (body.current_password !== undefined) {
      // Password change
      const data = await getCustomerById(customer.id);
      if (!data || !data.password_hash) {
        return NextResponse.json({ error: "No password set" }, { status: 400 });
      }
      const valid = await bcrypt.compare(body.current_password as string, data.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      const newPass = body.new_password as string;
      if (!newPass || newPass.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      }
      const password_hash = await bcrypt.hash(newPass, 12);
      await sql`UPDATE customers SET password_hash = ${password_hash}, updated_at = NOW() WHERE id = ${customer.id}`;
      return NextResponse.json({ ok: true });
    }

    // Profile update
    const newName = body.name !== undefined ? (body.name as string | null) : null;
    const newPhone = body.phone !== undefined ? (body.phone as string | null) : null;
    await sql`
      UPDATE customers
      SET name = COALESCE(${newName}, name),
          phone = COALESCE(${newPhone}, phone),
          updated_at = NOW()
      WHERE id = ${customer.id}
    `;

    const updated = await getCustomerById(customer.id);
    return NextResponse.json({
      id: updated!.id,
      email: updated!.email,
      name: updated!.name,
      phone: updated!.phone,
      email_verified: updated!.email_verified,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
