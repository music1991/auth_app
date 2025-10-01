import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { CODE_TIME, sendVerificationEmail } from "@/lib/email";

const dataRoot = path.resolve(process.cwd(), "..", "..", "data");
const verificationsPath = path.join(dataRoot, "verifications.json");
const usersPath = path.join(dataRoot, "users.json");

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const rawUsers = await fs.readFile(usersPath, "utf-8").catch(() => "[]");
    const users = JSON.parse(rawUsers) as any[];
    const user = users.find((u) => String(u.email || "").toLowerCase() === email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.verified) {
      return NextResponse.json({ error: "User already verified" }, { status: 400 });
    }

    const rawVerif = await fs.readFile(verificationsPath, "utf-8").catch(() => "[]");
    const verifs = JSON.parse(rawVerif) as any[];

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + CODE_TIME * 60 * 1000).toISOString();

    const remaining = verifs.filter(
      (v) => String(v.email || "").toLowerCase() !== email
    );
    remaining.push({
      id: randomUUID(),
      email,
      code,
      consumed: false,
      expiresAt,
    });

    try {
      await fs.writeFile(verificationsPath, JSON.stringify(remaining, null, 2));
    } catch (err) {
      console.error("Failed to write verifications.json:", err);
      return NextResponse.json(
        { error: "Could not save verification" },
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
    console.error("POST /verifications failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
