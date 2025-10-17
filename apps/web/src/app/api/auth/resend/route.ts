import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { CODE_TIME, sendVerificationEmail } from "@/lib/email/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown, max = 256) {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(req: Request) {
  try {
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = clean(body.email, 254).toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.verified) {
      return NextResponse.json({ error: "User already verified" }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TIME * 60 * 1000);

    await db.upsertVerificationForUser({
      id: randomUUID(),
      user_id: user.id,
      code,
      expiresAt,
    });

    try {
      await sendVerificationEmail(email, code);
    } catch (err) {
      console.error("[verifications] sendVerificationEmail failed:", err);
      return NextResponse.json(
        { error: "Could not send verification email" },
        { status: 500 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      user_id: user.id,
      expiresAt: expiresAt.toISOString(),
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("POST /verifications failed:", err);
    const payload =
      process.env.NODE_ENV !== "production"
        ? { error: "Internal Server Error", detail: String(err) }
        : { error: "Internal Server Error" };
    const res = NextResponse.json(payload, { status: 500 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
