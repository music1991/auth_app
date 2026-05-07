import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    const { id } = await params;

    if (session.userId === id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const user = await db.getUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    try {
      await db.deleteVerificationsByUserId(user.id);
    } catch (e) {
      console.error("[admin/users/delete] deleteVerificationsByUserId failed:", e);
      return NextResponse.json({ error: "Failed to clean up verifications" }, { status: 500 });
    }

    try {
      await db.deleteUserById(user.id);
    } catch (e) {
      console.error("[admin/users/delete] deleteUserById failed:", e);
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("DELETE /api/users/[id]/delete failed:", err);
    const res = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
}
