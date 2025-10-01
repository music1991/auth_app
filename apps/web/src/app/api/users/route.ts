import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";

const dataRoot = path.resolve(process.cwd(), "..", "..", "data");
const usersPath = path.join(dataRoot, "users.json");

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const raw = await fs.readFile(usersPath, "utf-8").catch(() => "[]");
    const users = JSON.parse(raw) as any[];

    const safe = users.map((u: any) => ({
      id: u.id,
      name: u.name ?? null,
      email: u.email,
      role: u.role ?? "user",
      verified: !!u.verified,
      createdAt: u.createdAt,
    }));

    const res = NextResponse.json(safe);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Error getting users" }, { status: 500 });
  }
}
