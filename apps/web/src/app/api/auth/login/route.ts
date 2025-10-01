import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dataRoot = path.resolve(process.cwd(), "..", "..", "data");
const usersPath = path.join(dataRoot, "users.json");

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const rawUsers = await fs.readFile(usersPath, "utf-8").catch(() => "[]");
    const users: any[] = JSON.parse(rawUsers);
    const user = users.find(
      (u) => String(u.email || "").toLowerCase() === email
    );

    if (!user) {
      return NextResponse.json(
        { error: "User does not have an account" },
        { status: 400 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
    }

    if (!user.verified) {
      return NextResponse.json(
        { error: "Account is not verified", code: 100 },
        { status: 400 }
      );
    }

    const role = (user.role ?? "user") as "user" | "admin";
    try {
      await setSession(user.id, role);
    } catch (err) {
      console.error("Failed to set session:", err);
      return NextResponse.json(
        { error: "Could not create session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[login] 500:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
