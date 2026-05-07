import { NextResponse } from "next/server";
import { getSession, signSessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 3,
};

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sesión expirada" }, { status: 401 });
  }

  const newToken = await signSessionToken(session.userId, session.role);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", newToken, COOKIE_OPTS);

  res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  return res;
}
