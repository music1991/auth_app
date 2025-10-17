import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { CODE_TIME, sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown, max = 256) {
  return String(v ?? "").trim().slice(0, max);
}

function isAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS || "";
  const admins = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function POST(req: Request) {
  try {
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = clean(body.name, 128) || null;
    const email = clean(body.email, 254).toLowerCase();
    const password = clean(body.password, 128);

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const role: "admin" | "user" = isAdminEmail(email) ? "admin" : "user";
    const password_hash = await bcrypt.hash(password, 10);
    const id = randomUUID();

    await db.insertUser({
      id,
      name,
      email,
      password_hash,
      role,
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TIME * 60 * 1000);

    await db.upsertVerificationForUser({
      id: randomUUID(),
      user_id: id,
      code,
      expiresAt,
    });

    try {
      await sendVerificationEmail(email, code);
    } catch (err) {
      console.error("[register] sendVerificationEmail failed:", err);
      return NextResponse.json({ error: "Could not send verification email" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      user_id: id,
      expiresAt: expiresAt.toISOString(),
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("[register] 500:", err);
    const payload =
      process.env.NODE_ENV !== "production"
        ? { error: "Internal Server Error", detail: String(err) }
        : { error: "Internal Server Error" };
    const res = NextResponse.json(payload, { status: 500 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
