import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export interface AdminTokenPayload {
  id: number;
  email: string;
  role: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[noir-admin] ADMIN_JWT_SECRET must be set in production. " +
        "Using an insecure default secret is not allowed."
      );
    }
    return new TextEncoder().encode(
      "dev-secret-change-in-production-min-32-chars!!"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(
  payload: AdminTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const { id, email, role } = payload as Record<string, unknown>;
    if (
      typeof id !== "number" ||
      typeof email !== "string" ||
      typeof role !== "string"
    ) {
      return null;
    }
    return { id, email, role };
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(
  req: NextRequest
): Promise<AdminTokenPayload | null> {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
