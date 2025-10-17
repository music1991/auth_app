import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown, max = 256) {
  return String(v ?? "").trim().slice(0, max);
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

    const email = clean(body.email, 254).toLowerCase();
    const code = clean(body.code, 6);

    if (!email || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.verified) {
      return NextResponse.json({ error: "User already verified" }, { status: 400 });
    }

    const verif = await db.getLatestValidVerificationByUserId(user.id, new Date());
    if (!verif) {
      return NextResponse.json({ error: "No valid verification" }, { status: 400 });
    }

    if (verif.code !== code) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    await db.consumeAllForUserId(user.id);
    await db.markVerifiedById(user.id);

    const res = NextResponse.json({ ok: true });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("[verify] 500:", err);
    const payload =
      process.env.NODE_ENV !== "production"
        ? { error: "Internal Server Error", detail: String(err) }
        : { error: "Internal Server Error" };
    const res = NextResponse.json(payload, { status: 500 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
