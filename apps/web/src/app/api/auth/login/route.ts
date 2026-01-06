// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Headers para prevenir cache
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
    // Verificar content-type
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

    // Parsear body
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

    // Validar campos
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

    // Buscar usuario
    const user = await db.getUserByEmail(email).catch((e) => {
      console.error("[login] db.getUserByEmail error:", e);
      throw e;
    });

    // Validar usuario existe y tiene password
    if (!user || !user.password_hash) {
      // Usar el mismo mensaje para no revelar información
      return NextResponse.json(
        { error: "Invalid email or password" }, 
        { 
          status: 401,
          headers: NO_CACHE_HEADERS
        }
      );
    }

    // Verificar password
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid email or password" }, 
        { 
          status: 401,
          headers: NO_CACHE_HEADERS
        }
      );
    }

    // Verificar si está verificado
    if (!user.verified) {
      return NextResponse.json(
        { 
          error: "Account is not verified", 
          code: 100,
          // Opcional: incluir email para reenvío de verificación
          email: user.email 
        }, 
        { 
          status: 403,
          headers: NO_CACHE_HEADERS
        }
      );
    }

    // Determinar rol
    const role = (user.role === "admin" ? "admin" : "user") as "admin" | "user";

    // Crear sesión
    const res = await setSession(user.id, role, user.name!);

    // Agregar headers adicionales de seguridad
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
    
    // Headers de no-cache también en errores
    res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    
    return res;
  }
}

// También es buena práctica manejar métodos no permitidos
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