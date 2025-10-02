import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { CODE_TIME, sendVerificationEmail } from "@/lib/email";
import { readJson, writeJson } from "@/lib/jsonStore";

export const runtime = "nodejs";
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

    const users: any[] = (await readJson("users.json")) ?? [];
    const user = users.find((u) => String(u.email || "").toLowerCase() === email);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.verified) {
      return NextResponse.json({ error: "User already verified" }, { status: 400 });
    }

    const verifs: any[] = (await readJson("verifications.json")) ?? [];

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

    await writeJson("verifications.json", remaining);

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
    console.error("POST /resend failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
