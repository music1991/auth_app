import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { CODE_TIME, sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dataRoot = path.resolve(process.cwd(), "..", "..", "data");
const usersPath = path.join(dataRoot, "users.json");
const verificationsPath = path.join(dataRoot, "verifications.json");
const adminsPath = path.join(dataRoot, "admins.json");

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const rawUsers = await fs.readFile(usersPath, "utf-8").catch(() => "[]");
    const users = JSON.parse(rawUsers) as any[];

    if (users.find((u) => String(u.email).toLowerCase() === email)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const rawAdmins = await fs.readFile(adminsPath, "utf-8").catch(() => "[]");
    const admins: string[] = JSON.parse(rawAdmins).map((e: string) => e.toLowerCase());

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

    try {
      await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
    } catch (err) {
      console.error("Failed to write users.json:", err);
      return NextResponse.json({ error: "Could not save user" }, { status: 500 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TIME * 60 * 1000).toISOString();

    const rawVerif = await fs.readFile(verificationsPath, "utf-8").catch(() => "[]");
    const verifs = JSON.parse(rawVerif) as any[];

    verifs.push({
      id: randomUUID(),
      email,
      code,
      consumed: false,
      expiresAt,
    });

    try {
      await fs.writeFile(verificationsPath, JSON.stringify(verifs, null, 2));
    } catch (err) {
      console.error("Failed to write verifications.json:", err);
      return NextResponse.json(
        { error: "Could not save verification request" },
        { status: 500 }
      );
    }

    try {
      await sendVerificationEmail(email, code);
    } catch (err) {
      console.error("Failed to send verification email:", err);
      return NextResponse.json(
        { error: "Could not send verification email" },
        { status: 500 }
      );
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
