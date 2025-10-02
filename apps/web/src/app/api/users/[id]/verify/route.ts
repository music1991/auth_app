import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/jsonStore";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users: any[] = (await readJson("users.json")) ?? [];
  const idx = users.findIndex((u) => u.id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const u = users[idx];
  if (u.verified) {
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      user: {
        id: u.id,
        name: u.name ?? null,
        email: u.email,
        role: u.role ?? "user",
        verified: !!u.verified,
        createdAt: u.createdAt,
      },
    });
  }

  users[idx].verified = true;
  await writeJson("users.json", users);

  return NextResponse.json({
    ok: true,
    user: {
      id: u.id,
      name: u.name ?? null,
      email: u.email,
      role: u.role ?? "user",
      verified: !!u.verified,
      createdAt: u.createdAt,
    },
  });
}
