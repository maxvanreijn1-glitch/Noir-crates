import { NextRequest, NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/lib/customer-auth";
import { getCustomerById } from "@/lib/db";

export async function requireCustomer(
  req: NextRequest
): Promise<{ id: number; email: string } | NextResponse> {
  try {
    const payload = await getCustomerFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const customer = await getCustomerById(payload.id);
    if (!customer || customer.is_banned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return payload;
  } catch (error) {
    console.error("[requireCustomer] Database error:", error);
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
