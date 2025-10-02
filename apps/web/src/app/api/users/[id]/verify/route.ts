import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dataRoot = path.resolve(process.cwd(), "..", "..", "data");
const usersPath = path.join(dataRoot, "users.json");

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = await fs.readFile(usersPath, "utf-8").catch(() => "[]");
  const users = JSON.parse(raw) as any[];
  const idx = users.findIndex((u: any) => u.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (users[idx].verified) {
    const u = users[idx];
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      user: {
        id: u.id, name: u.name ?? null, email: u.email,
        role: u.role ?? "user", verified: !!u.verified, createdAt: u.createdAt,
      },
    });
  }

  users[idx].verified = true;
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2));

  const u = users[idx];
  return NextResponse.json({
    ok: true,
    user: {
      id: u.id, name: u.name ?? null, email: u.email,
      role: u.role ?? "user", verified: !!u.verified, createdAt: u.createdAt,
    },
  });
}
