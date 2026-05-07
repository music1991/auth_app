import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

function clean(v: unknown, max = 256) {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { ok, retryAfter } = rateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
    if (!ok) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intentá de nuevo en ${retryAfter} segundos.` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" }, 
        { 
          status: 400,
          headers: NO_CACHE_HEADERS
        }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON" }, 
        { 
          status: 400,
          headers: NO_CACHE_HEADERS
        }
      );
    }

    const email = clean(body.email, 254).toLowerCase();
    const password = clean(body.password, 128);

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" }, 
        { 
          status: 400,
          headers: NO_CACHE_HEADERS
        }
      );
    }

    const user = await db.getUserByEmail(email).catch((e) => {
      console.error("[login] db.getUserByEmail error:", e);
      throw e;
    });

    if (!user || !user.password_hash) {
      return NextResponse.json(
        { error: "Invalid email or password" }, 
        { 
          status: 401,
          headers: NO_CACHE_HEADERS
        }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" }, 
        { 
          status: 401,
          headers: NO_CACHE_HEADERS
        }
      );
    }

    if (!user.verified) {
      return NextResponse.json(
        { 
          error: "Account is not verified", 
          code: 100,
          email: user.email 
        }, 
        { 
          status: 403,
          headers: NO_CACHE_HEADERS
        }
      );
    }

    const role = (user.role === "admin" ? "admin" : "user") as "admin" | "user";

    const res = await setSession(user.id, role, user.name!);

    res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    res.headers.set("X-Content-Type-Options", "nosniff");

    return res;

  } catch (err) {
    console.error("[login] 500:", err);
    
    const payload = {
      error: "Internal Server Error",
      ...(process.env.NODE_ENV !== "production" && { detail: String(err) })
    };

    const res = NextResponse.json(payload, { status: 500 });
    
    res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    
    return res;
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" }, 
    { 
      status: 405,
      headers: NO_CACHE_HEADERS
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" }, 
    { 
      status: 405,
      headers: NO_CACHE_HEADERS
    }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" }, 
    { 
      status: 405,
      headers: NO_CACHE_HEADERS
    }
  );
}