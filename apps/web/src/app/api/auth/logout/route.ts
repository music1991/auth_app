import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();

/*   if (session?.userId) {
    await dashboardDb.markUserOffline(session.userId).catch((e) => {
      console.error("[logout] markUserOffline error:", e);
    });
  } */

  const res = clearSession();
  const redirect = NextResponse.redirect(new URL("/", req.url));

  for (const setCookie of res.headers.getSetCookie()) {
    redirect.headers.append("Set-Cookie", setCookie);
  }

  redirect.headers.set("Cache-Control", "no-store");
  return redirect;
}
