import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "quadrados_admin";

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET ausente ou curto demais (mín. 16 caracteres).");
  }
  return new TextEncoder().encode(s);
}

export async function signAdminToken(adminId: string, username: string): Promise<string> {
  return new SignJWT({ sub: adminId, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<{ sub: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const username = typeof payload.username === "string" ? payload.username : null;
    if (!sub || !username) return null;
    return { sub, username };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<{ sub: string; username: string } | null> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return null;
  return verifyAdminToken(t);
}

export { COOKIE as ADMIN_COOKIE_NAME };
