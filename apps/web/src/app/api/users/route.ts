import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { dashboardDb } from "@/lib/dashboard-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper para respuestas con no-cache
const jsonResponse = (data: any, status = 200) => {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
};

/**
 * Función de formateo unificada
 * @param u Datos crudos de la DB
 * @param onlineIds Array de IDs conectados al Socket
 */
const formatUser = (u: any, onlineIds: string[] = []) => {
  const isOnline = onlineIds.includes(u.id);

  return {
    id: u.id,
    name: u.name ?? "Sin nombre",
    email: u.email,
    role: (u.role ?? "user") as "user" | "admin",
    // Prioridad al Socket: si está conectado es 'active', sino el status de DB
    status: isOnline ? "active" : (u.status ?? "inactive"),
    verified: !!u.verified,
    createdAt: u.created_at || new Date().toISOString(),
    lastLogin: u.last_login || u.last_login_at || null,
    lastSeen: u.last_seen || u.last_seen_at || null,
    // Campos de métricas (si existen en la consulta)
    ...(u.tasks_assigned !== undefined && {
      tasksAssigned: Number(u.tasks_assigned ?? 0),
      tasksCompleted: Number(u.tasks_completed ?? 0),
      productivityScore: Number(u.productivity_score ?? 0),
    }),
  };
};

export async function GET(req: Request) {
  try {
    // 1. Verificación de Autorización
    const session = await getSession();
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);
    if (session.role !== "admin") return jsonResponse({ error: "Forbidden" }, 403);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const withMetrics = searchParams.get("withMetrics") === "1";

    // 2. Obtener presencia en tiempo real desde el servidor Socket
    let onlineIds: string[] = [];
    try {
      // Añadimos ?t=... para que la URL sea única y Next no use cache
      const socketUrl = `http://localhost:4000/api/online-ids?t=${Date.now()}`;

      console.log("🚀 Intentando llamar a:", socketUrl);

      const socketRes = await fetch(socketUrl, {
        method: 'GET',
        cache: 'no-store', // Crucial
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (socketRes.ok) {
        onlineIds = await socketRes.json();
        console.log("✅ Respuesta del Socket Server:", onlineIds);
      } else {
        console.error("⚠️ El Socket Server respondió con status:", socketRes.status);
      }
    } catch (e: any) {
      console.error("❌ Error de red conectando al Socket Server:", e.message);
    }
    // 3. Lógica según parámetros

    // CASO A: Usuario específico por ID
    if (id) {
      const u = await db.getUserWithDataById(id);
      if (!u) return jsonResponse({ error: "User not found" }, 404);
      return jsonResponse(formatUser(u, onlineIds));
    }

    // CASO C: Lista general (por defecto)
    const users = await dashboardDb.getAllUsers();
    if (!users) return jsonResponse([], 200);
    return jsonResponse(users.map(u => formatUser(u, onlineIds)));

  } catch (err: any) {
    console.error("❌ GET /admin/users failed:", err.message);
    return jsonResponse({
      error: "Internal Server Error",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined
    }, 500);
  }
}