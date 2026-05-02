import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasksDb } from "@/lib/db/tasks-db";
import { formatUser } from "../dashboard/admin/users/route";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonResponse = (data: any, status = 200) => {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
};

const urlService = process.env.NEXT_PUBLIC_SERVICES_URL;

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);
    if (session.role !== "admin") return jsonResponse({ error: "Forbidden" }, 403);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const withMetrics = searchParams.get("withMetrics") === "1";

    let onlineIds: string[] = [];
    try {
      const socketUrl = `${urlService}/online-ids?t=${Date.now()}`;

   //   console.log("ðŸš€ Intentando llamar a:", socketUrl);

      const socketRes = await fetch(socketUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (socketRes.ok) {
        onlineIds = await socketRes.json();
     //   console.log("âœ… Respuesta del Socket Server:", onlineIds);
      } else {
     //   console.error("âš ï¸ El Socket Server respondiÃ³ con status:", socketRes.status);
      }
    } catch (e: any) {
   //   console.error("âŒ Error de red conectando al Socket Server:", e.message);
    }

    if (id) {
      const u = await db.getUserWithDataById(id);
      if (!u) return jsonResponse({ error: "User not found" }, 404);
      return jsonResponse(formatUser(u, onlineIds));
    }

 
    const users = await tasksDb.getAllUsers();
    if (!users) return jsonResponse([], 200);
    return jsonResponse(users.map(u => formatUser(u, onlineIds)));

  } catch (err: any) {
    return jsonResponse({
      error: "Internal Server Error",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined
    }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);
    if (session.role !== "admin") return jsonResponse({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { name, email, password, role } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!name?.trim()) return jsonResponse({ error: "El nombre es requerido" }, 400);
    if (!email?.trim()) return jsonResponse({ error: "El correo es requerido" }, 400);
    if (!password || password.length < 6) return jsonResponse({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
    if (role !== "user" && role !== "admin") return jsonResponse({ error: "Rol inválido" }, 400);

    const existing = await db.getUserByEmail(email);
    if (existing) return jsonResponse({ error: "Ya existe un usuario con ese correo" }, 409);

    const id = randomUUID();
    const password_hash = await bcrypt.hash(password, 10);

    await db.insertUser({ id, name: name.trim(), email: email.trim(), password_hash, role });
    await db.markVerifiedById(id);

    return jsonResponse({ success: true, id }, 201);
  } catch (err: any) {
    return jsonResponse({
      error: "Internal Server Error",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
    }, 500);
  }
}
