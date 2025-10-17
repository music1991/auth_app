// apps/web/src/lib/auth.ts
import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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
  maxAge: 60 * 60 * 3, // 3h (independent of JWT; adjust if you want them aligned)
};

/** Sets cookies and RETURNS a NextResponse you can return from the route */
export async function setSession(userId: string, role: Role, name: string) {
  const token = await signSessionToken(userId, role);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, COOKIE_OPTS);
  res.cookies.set("role", role, COOKIE_OPTS);
  res.cookies.set("name", name, COOKIE_OPTS);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/** Reads the session from request cookies */
export async function getSession(): Promise<Session | null> {
  const jar = await cookies(); // no await needed
  const token = jar.get("session")?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/** Clears cookies and RETURNS a NextResponse */
export function clearSession() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { ...COOKIE_OPTS, maxAge: 0 });
  res.cookies.set("role", "", { ...COOKIE_OPTS, maxAge: 0 });
  res.cookies.set("name", "", { ...COOKIE_OPTS, maxAge: 0 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
