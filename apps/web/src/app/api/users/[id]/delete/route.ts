import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { readJson, writeJson } from "@/lib/jsonStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }
  if (session.sub === params.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const users: any[] = (await readJson("users.json")) ?? [];
  const user = users.find((u) => u.id === params.id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const updatedUsers = users.filter((u) => u.id !== params.id);
  await writeJson("users.json", updatedUsers);

  const verifs: any[] = (await readJson("verifications.json")) ?? [];
  const remaining = verifs.filter(
    (v) => String(v.email).toLowerCase() !== String(user.email).toLowerCase()
  );
  await writeJson("verifications.json", remaining);

  return NextResponse.json({ ok: true });
}
