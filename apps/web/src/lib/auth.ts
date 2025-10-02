import "server-only";
import { NextResponse } from "next/server";
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

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 3,
};

export async function setSession<T>(
  res: NextResponse<T>,
  userId: string,
  role: Role
): Promise<NextResponse<T>> {
  const token = await signSessionToken(userId, role);
  res.cookies.set("session", token, COOKIE_OPTS);
  res.cookies.set("role", role, COOKIE_OPTS);
  return res;
}

export function clearSession(res: NextResponse) {
  res.cookies.delete("session");
  res.cookies.delete("role");
  return res;
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
