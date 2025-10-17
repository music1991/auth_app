// apps/web/src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await db.listUsers();

    const safe = users.map((u) => ({
      id: u.id,
      name: u.name ?? null,
      lastName: u.last_name ?? null,
      email: u.email,
      role: u.role ?? "user",
      verified: !!u.verified,
      createdAt: u.created_at,
    }));

    const res = NextResponse.json(safe);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("GET /admin/users failed:", err);
    const res = NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Error getting users", detail: String(err) }
        : { error: "Error getting users" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
