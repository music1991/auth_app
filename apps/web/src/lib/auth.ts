import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export type Role = "admin" | "user";

export type Session = {
  userId: string;
  role: Role;
  iat: number;
  exp: number;
  lastActivity: number;
};

function getSecret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export async function signSessionToken(userId: string, role: Role) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = process.env.JWT_EXPIRES || "2h";

  return await new SignJWT({
    role,
    iat: now,
    lastActivity: now,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    const sub = payload.sub ? String(payload.sub) : "";
    if (!sub) return null;

    const lastActivitySec = Number(payload.lastActivity);
    if (!Number.isFinite(lastActivitySec) || lastActivitySec <= 0) return null;

    const lastActivityMs = lastActivitySec * 1000;
    if (Date.now() - lastActivityMs > INACTIVITY_TIMEOUT) {
      return null;
    }

    const role: Role = payload.role === "admin" ? "admin" : "user";

    return {
      userId: sub,
      role,
      iat: Number(payload.iat) || 0,
      exp: Number(payload.exp) || 0,
      lastActivity: lastActivitySec,
    };
  } catch {
    return null;
  }
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 3,
};

export async function setSession(userId: string, role: Role, name: string) {
  const token = await signSessionToken(userId, role);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, COOKIE_OPTS);
  res.cookies.set("id", userId, COOKIE_OPTS);
  res.cookies.set("role", role, COOKIE_OPTS);
  res.cookies.set("name", name, COOKIE_OPTS);

  res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");

  return res;
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get("session")?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export function clearSession() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "", { ...COOKIE_OPTS, maxAge: 0 });
  res.cookies.set("role", "", { ...COOKIE_OPTS, maxAge: 0 });
  res.cookies.set("name", "", { ...COOKIE_OPTS, maxAge: 0 });

  res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");

  return res;
}

export async function updateSessionActivity() {
  const session = await getSession();
  if (!session) return null;

  const now = Math.floor(Date.now() / 1000);

  const newToken = await new SignJWT({
    role: session.role,
    iat: now,
    lastActivity: now,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setExpirationTime(process.env.JWT_EXPIRES || "2h")
    .sign(getSecret());

  const res = NextResponse.next();
  res.cookies.set("session", newToken, COOKIE_OPTS);
  return res;
}
