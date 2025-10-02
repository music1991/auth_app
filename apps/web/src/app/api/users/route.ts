import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readJson } from "@/lib/jsonStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users: any[] = (await readJson("users.json")) ?? [];

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
    console.error("GET /api/users failed:", err);
    return NextResponse.json({ error: "Error getting users" }, { status: 500 });
  }
}
