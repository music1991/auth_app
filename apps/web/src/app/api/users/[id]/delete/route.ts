import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dataRoot = path.resolve(process.cwd(), "..", "..", "data");
const usersPath = path.join(dataRoot, "users.json");
const verificationsPath = path.join(dataRoot, "verifications.json");

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  if (session.sub === params.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const raw = await fs.readFile(usersPath, "utf-8").catch(() => "[]");
  const users = JSON.parse(raw) as any[];
  const user = users.find((u: any) => u.id === params.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const updatedUsers = users.filter((u: any) => u.id !== params.id);
    await fs.writeFile(
      usersPath,
      JSON.stringify(updatedUsers, null, 2)
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update users database" },
      { status: 500 }
    );
  }

  try {
    const rawV = await fs.readFile(verificationsPath, "utf-8").catch(() => "[]");
    const verifs = JSON.parse(rawV) as any[];
    const remaining = verifs.filter((v: any) => String(v.email).toLowerCase() !== String(user.email).toLowerCase());
    await fs.writeFile(verificationsPath, JSON.stringify(remaining, null, 2));
  } catch {
    return NextResponse.json(
      { error: "Failed to clean up verifications" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
