import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { CODE_TIME, sendVerificationEmail } from "@/lib/email";
import { readJson, writeJson } from "@/lib/jsonStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const users = (await readJson<any[]>("users.json")) ?? [];
    if (users.find((u) => String(u.email).toLowerCase() === email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const admins = ((await readJson<string[]>("admins.json")) ?? []).map(e => e.toLowerCase());
    const role: "admin" | "user" = admins.includes(email) ? "admin" : "user";

    const newUser = {
      id: randomUUID(),
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      verified: false,
      role,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeJson("users.json", users);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TIME * 60 * 1000).toISOString();

    const verifs = (await readJson<any[]>("verifications.json")) ?? [];
    verifs.push({ id: randomUUID(), email, code, consumed: false, expiresAt });
    await writeJson("verifications.json", verifs);

    try { await sendVerificationEmail(email, code); }
    catch {
      return NextResponse.json({ error: "Could not send verification email" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      expiresAt,
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("POST /register failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
