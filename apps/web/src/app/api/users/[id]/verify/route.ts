import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await db.getUserById(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.verified) {
      const res = NextResponse.json({
        ok: true,
        alreadyVerified: true,
        user: {
          id: user.id,
          name: user.name ?? null,
          lastName: user.last_name ?? null,
          email: user.email,
          role: user.role ?? "user",
          verified: !!user.verified,
          createdAt: user.created_at,
        },
      });
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    await db.markVerifiedById(user.id);
    await db.consumeAllForUserId(user.id);

    const updated = await db.getUserById(user.id);

    const res = NextResponse.json({
      ok: true,
      user: {
        id: updated?.id ?? user.id,
        name: (updated?.name ?? user.name) ?? null,
        lastName: (updated?.last_name ?? user.last_name) ?? null,
        email: updated?.email ?? user.email,
        role: (updated?.role ?? user.role) ?? "user",
        verified: !!(updated?.verified ?? true),
        createdAt: updated?.created_at ?? user.created_at,
      },
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("POST /admin/users/[id]/verify failed:", err);
    const res = NextResponse.json(
      process.env.NODE_ENV !== "production"
        ? { error: "Internal Server Error", detail: String(err) }
        : { error: "Internal Server Error" },
      { status: 500 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
