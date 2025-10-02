import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/jsonStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const email = String(body.email || "").trim().toLowerCase();
    const code  = String(body.code  || "").trim();
    const now   = new Date();

    const verifs: any[] = (await readJson("verifications.json")) ?? [];

    const candidates = verifs.filter(
      (v) =>
        String(v.email || "").toLowerCase() === email &&
        !v.consumed &&
        new Date(v.expiresAt) > now
    );
    const match = candidates.at(-1);

    if (!match) return NextResponse.json({ error: "Invalid code." }, { status: 400 });
    if (now > new Date(match.expiresAt)) {
      return NextResponse.json({ error: "Code has expired." }, { status: 400 });
    }
    if (String(match.code).trim() !== code) {
      return NextResponse.json({ error: "Invalid code." }, { status: 400 });
    }

    for (const v of verifs) {
      if (String(v.email || "").toLowerCase() === email) v.consumed = true;
    }
    await writeJson("verifications.json", verifs);

    const users: any[] = (await readJson("users.json")) ?? [];
    const user = users.find((u) => String(u.email || "").toLowerCase() === email);
    if (user) {
      user.verified = true;
      await writeJson("users.json", users);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /verify failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
