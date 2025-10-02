import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readJson } from "@/lib/jsonStore";
import { setSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email = "", password = "" } = await req.json().catch(() => ({}));
    const emailNorm = String(email).trim().toLowerCase();
    const pass = String(password);
    if (!emailNorm || !pass) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const users: any[] = (await readJson("users.json")) ?? [];
    const user = users.find((u) => String(u.email || "").toLowerCase() === emailNorm);
    if (!user) return NextResponse.json({ error: "User does not have an account" }, { status: 400 });

    const ok = await bcrypt.compare(pass, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
    if (!user.verified) {
      return NextResponse.json({ error: "Account is not verified", code: 100 }, { status: 400 });
    }

    const role = (user.role ?? "user") as "user" | "admin";
    let res = NextResponse.json({ ok: true });
    res = await setSession(res, user.id, role);
    return res;
  } catch (err) {
    console.error("[login] 500:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
