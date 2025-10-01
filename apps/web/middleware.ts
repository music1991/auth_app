
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_AUTH_PATHS = ["/login", "/register", "/verify"];

const SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

function isAuthPath(pathname: string) {
  return PUBLIC_AUTH_PATHS.includes(pathname) || pathname.startsWith("/auth/");
}
function isUsers(pathname: string) {
  return pathname.startsWith("/users");
}

async function verifyToken(
  token?: string
): Promise<{ valid: boolean; role: "admin" | "user" }> {
  if (!token || !SECRET) return { valid: false, role: "user" };
  try {
    const { jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(token, SECRET);
    const role = payload.role === "admin" ? "admin" : "user";
    return { valid: true, role };
  } catch (err) {
    console.error("middleware jwt verify failed:", err);
    return { valid: false, role: "user" };
  }
}

export async function middleware(req: NextRequest) {
  try {
    const session = req.cookies.get("session")?.value;
    const { pathname } = req.nextUrl;

    const { valid: logged, role } = await verifyToken(session);

    if (!logged && session) {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete("session");
      res.cookies.delete("role");
      return res;
    }

    if (!logged && (pathname === "/" || isUsers(pathname))) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (logged && isUsers(pathname) && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (logged && isAuthPath(pathname)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("middleware fatal:", err);
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("session");
    res.cookies.delete("role");
    return res;
  }
}

export const config = {
  matcher: ["/", "/users/:path*", "/login", "/register", "/verify", "/auth/:path*"],
};
