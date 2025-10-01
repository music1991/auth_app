import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Role = "admin" | "user";
export type Session = { sub: string; role: Role };

function getSecret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function signSessionToken(userId: string, role: Role) {
  return await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime(process.env.JWT_EXPIRES || "2h")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  const role: Role = payload.role === "admin" ? "admin" : "user";
  return { sub: String(payload.sub), role } as Session;
}

const isProd = process.env.NODE_ENV === "production";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: isProd,
  maxAge: 60 * 60 * 3,
};

export async function setSession(userId: string, role: Role) {
  const token = await signSessionToken(userId, role);
  const jar = await cookies();
  jar.set("session", token, COOKIE_OPTS);
  jar.set("role", role, COOKIE_OPTS);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

// export async function clearSession() {
//   const jar = await cookies();
//   jar.delete("session");
//   jar.delete("role");
// }
