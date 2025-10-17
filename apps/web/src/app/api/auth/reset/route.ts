import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumeTokenAndUpdatePassword } from "@/lib/forgot-password";
import { isStrongPassword } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown, max = 256) {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(req: Request) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null as any);
    const token = clean(body?.token, 1024);
    const password = clean(body?.password, 128);

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "Password does not meet complexity rules" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const ok = await consumeTokenAndUpdatePassword(token, hash);

    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("[reset] 500:", err);
    const res = NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
