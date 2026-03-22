import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { dashboardDb } from "@/lib/dashboard-db";
import { formatUser } from "../dashboard/admin/users/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonResponse = (data: any, status = 200) => {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
};

const urlService = process.env.SERVICES_URL;

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
      const socketUrl = `${urlService}/api/online-ids?t=${Date.now()}`;

   //   console.log("🚀 Intentando llamar a:", socketUrl);

      const socketRes = await fetch(socketUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (socketRes.ok) {
        onlineIds = await socketRes.json();
     //   console.log("✅ Respuesta del Socket Server:", onlineIds);
      } else {
     //   console.error("⚠️ El Socket Server respondió con status:", socketRes.status);
      }
    } catch (e: any) {
   //   console.error("❌ Error de red conectando al Socket Server:", e.message);
    }

    if (id) {
      const u = await db.getUserWithDataById(id);
      if (!u) return jsonResponse({ error: "User not found" }, 404);
      return jsonResponse(formatUser(u, onlineIds));
    }

 
    const users = await dashboardDb.getAllUsers();
    if (!users) return jsonResponse([], 200);
    return jsonResponse(users.map(u => formatUser(u, onlineIds)));

  } catch (err: any) {
    return jsonResponse({
      error: "Internal Server Error",
      detail: process.env.NODE_ENV !== "production" ? err.message : undefined
    }, 500);
  }
}