import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function POST() {
   const session = await getSession();
  try {
   
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ ok: true }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
  console.error("[presence] heartbeat 500:", err);

  return NextResponse.json(
    {
      error: "Internal Server Error",
      // solo en dev, para ver el motivo real
      detail: process.env.NODE_ENV !== "production" ? String(err?.message ?? err) : undefined,
      code: process.env.NODE_ENV !== "production" ? err?.code : undefined,
    },
    { status: 500, headers: NO_CACHE_HEADERS }
  );
}
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405, headers: NO_CACHE_HEADERS });
}
