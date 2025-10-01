import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_AUTH_PATHS = ["/login", "/register", "/verify"];

function isAuthPath(pathname: string) {
  return PUBLIC_AUTH_PATHS.includes(pathname) || pathname.startsWith("/auth/");
}
function isUsers(pathname: string) {
  return pathname.startsWith("/users");
}

export function middleware(req: NextRequest) {
  try {
    const session = req.cookies.get("session")?.value;
    const role = req.cookies.get("role")?.value ?? "user";
    const { pathname } = req.nextUrl;

    if (!session && (pathname === "/" || isUsers(pathname))) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (session && isUsers(pathname) && role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (session && isAuthPath(pathname)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("edge middleware error:", err);
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("session");
    res.cookies.delete("role");
    return res;
  }
}

export const config = {
  matcher: ["/", "/users/:path*", "/login", "/register", "/verify", "/auth/:path*"],
};
