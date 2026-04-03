import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export interface CustomerTokenPayload {
  id: number;
  email: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.CUSTOMER_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[noir] CUSTOMER_JWT_SECRET must be set in production.");
    }
    return new TextEncoder().encode("dev-customer-secret-change-in-production!!");
  }
  return new TextEncoder().encode(secret);
}

export async function signCustomerToken(payload: CustomerTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { id, email } = payload as Record<string, unknown>;
    if (typeof id !== "number" || typeof email !== "string") return null;
    return { id, email };
  } catch {
    return null;
  }
}

export async function getCustomerFromRequest(req: NextRequest): Promise<CustomerTokenPayload | null> {
  const token = req.cookies.get("customer_token")?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}
