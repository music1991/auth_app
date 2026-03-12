import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonResponse = (data: any, status = 200) => {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
};

const formatUser = (u: any, onlineIds: string[] = []) => {
  const isOnline = onlineIds.includes(u.id);

  return {
    id: u.id,
    name: u.name ?? "Sin nombre",
    email: u.email,
    role: (u.role ?? "user") as "user" | "admin",
    status: isOnline ? "active" : (u.status ?? "inactive"),
    verified: !!u.verified,
    createdAt: u.created_at || new Date().toISOString(),
    lastLogin: u.last_login || u.last_login_at || null,
    lastSeen: u.last_seen || u.last_seen_at || null,

    tasksAssigned: Number(u.tasks_assigned ?? 0),
    tasksCompleted: Number(u.tasks_completed ?? 0),
    productivityScore: Number(u.productivity_score ?? 0),
  };
};

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (session.role !== "admin") {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    let onlineIds: string[] = [];

    try {
      const socketUrl = `http://localhost:4000/api/online-ids?t=${Date.now()}`;

      const socketRes = await fetch(socketUrl, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (socketRes.ok) {
        onlineIds = await socketRes.json();
      }
    } catch (e: any) {
      console.error("Socket presence error:", e.message);
    }

    const users = await dashboardDb.getUsersWithMetrics();

    if (!users) {
      return jsonResponse([], 200);
    }

    return jsonResponse(users.map((u) => formatUser(u, onlineIds)));
  } catch (err: any) {
    console.error("GET /users/metrics failed:", err.message);

    return jsonResponse(
      {
        error: "Internal Server Error",
        detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
      },
      500
    );
  }
}