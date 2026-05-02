import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();

  const res = clearSession();
  const redirect = NextResponse.redirect(new URL("/", req.url));

  for (const setCookie of res.headers.getSetCookie()) {
    redirect.headers.append("Set-Cookie", setCookie);
  }

  redirect.headers.set("Cache-Control", "no-store");
  return redirect;
}
