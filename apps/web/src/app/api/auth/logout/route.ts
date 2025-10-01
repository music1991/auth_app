import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const cs = await cookies();
  cs.delete("session");
  return NextResponse.json({ ok: true });
}