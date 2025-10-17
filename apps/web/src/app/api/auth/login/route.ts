// apps/web/src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown, max = 256) {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(req: Request) {
  try {
    // Ensure JSON body
    if (!req.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = clean(body.email, 254).toLowerCase();
    const password = clean(body.password, 128);

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await db.getUserByEmail(email).catch((e) => {
      console.error("[login] db.getUserByEmail error:", e);
      throw e;
    });

    if (!user || !user.password_hash) {
      // Don’t leak which field failed in production; you can split if you prefer
      return NextResponse.json({ error: "Invalid email or password", user }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.verified) {
      return NextResponse.json({ error: "Account is not verified", code: 100 }, { status: 403 });
    }

    const role = (user.role === "admin" ? "admin" : "user") as "admin" | "user";

    // setSession should return a NextResponse with cookies set.
    const res = await setSession(user.id, role);

    // Ensure no caching of auth responses
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("[login] 500:", err);
    const payload =
      process.env.NODE_ENV !== "production"
        ? { error: "Internal Server Error", detail: String(err) }
        : { error: "Internal Server Error" };
    const res = NextResponse.json(payload, { status: 500 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
