import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dataRoot = path.resolve(process.cwd(), "..", "..", "data");
const usersPath = path.join(dataRoot, "users.json");
const verificationsPath = path.join(dataRoot, "verifications.json");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    const now = new Date();

    const rawVerif = await fs.readFile(verificationsPath, "utf-8").catch(() => "[]");
    const verifs: any[] = JSON.parse(rawVerif);

    const candidates = verifs.filter(
      (v) =>
        String(v.email || "").toLowerCase() === email &&
        !v.consumed &&
        new Date(v.expiresAt) > now
    );
    const match = candidates.at(-1);

    if (!match) {
      return NextResponse.json({ error: "Invalid code." }, { status: 400 });
    }

    if (match.expiresAt && now > new Date(match.expiresAt)) {
      return NextResponse.json({ error: "Code has expired." }, { status: 400 });
    }

    if (String(match.code).trim() !== code) {
      return NextResponse.json({ error: "Invalid code." }, { status: 400 });
    }

    try {
      for (const v of verifs) {
        if (String(v.email || "").toLowerCase() === email) v.consumed = true;
      }
      await fs.writeFile(verificationsPath, JSON.stringify(verifs, null, 2));
    } catch (err) {
      console.error("Failed to update verifications:", err);
      return NextResponse.json(
        { error: "Failed to update verifications database" },
        { status: 500 }
      );
    }

    try {
      const rawUsers = await fs.readFile(usersPath, "utf-8").catch(() => "[]");
      const users: any[] = JSON.parse(rawUsers);
      const user = users.find(
        (u) => String(u.email || "").toLowerCase() === email
      );

      if (user) {
        user.verified = true;
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
      }
    } catch (err) {
      console.error("Failed to update users:", err);
      return NextResponse.json(
        { error: "Failed to update users database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /verify failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
