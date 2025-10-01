import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_AUTH_PATHS = ["/login", "/register", "/verify"];

function isAuthPath(pathname: string) {
  return (
    PUBLIC_AUTH_PATHS.includes(pathname) ||
    pathname.startsWith("/auth/")
  );
}

function isUsers(pathname: string) {
  return pathname.startsWith("/users");
}

async function isValid(token?: string) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  const role = req.cookies.get("role")?.value;
  const { pathname } = req.nextUrl;

  const logged = await isValid(session);

  // Cookie inválida → purga y trata como no logueado
  if (!logged && (session || role)) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("session");
    res.cookies.delete("role");
    return res;
  }

  // No logueado → bloquea home y /users
  if (!logged && (pathname === "/" || isUsers(pathname))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logueado pero NO admin → bloquea /users
  if (logged && isUsers(pathname) && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Logueado → fuera de login/register/verify
  if (logged && isAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/users/:path*", "/login", "/register", "/verify", "/auth/:path*"],
};
