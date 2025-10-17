import { NextResponse } from "next/server";
import { randomBytes, createHash, randomUUID } from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown, max = 256) {
  return String(v ?? "").trim().slice(0, max);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const EXP_MIN = 3;

export async function POST(req: Request) {
  try {
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const email = clean(body?.email, 254).toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    const token = randomBytes(32).toString("base64url");
    const token_hash = hashToken(token);
    const expires_at = new Date(Date.now() + EXP_MIN * 60 * 1000);

    await db.insertPasswordReset({
      id: randomUUID(),
      user_id: user.id,
      token_hash,
      expires_at,
    });

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const resetUrl = `${origin}/reset/${encodeURIComponent(token)}`;

    await sendPasswordResetEmail(email, resetUrl, expires_at);

    const res = NextResponse.json({ ok: true });
    res.headers.set("Cache-Control", "no-store");
    return res;

  } catch (err) {
    console.error("[forgot] 500:", err);
    const res = NextResponse.json(
      { error: "Internal Server Error", detail: String(err) },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
