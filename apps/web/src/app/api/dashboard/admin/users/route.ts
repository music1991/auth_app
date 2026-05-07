import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { tasksDb } from "@/lib/db/tasks-db";
import { UserWithMetrics } from "@/types";

const urlService = process.env.NEXT_PUBLIC_SERVICES_URL;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OnlineEntry { userId: string }

const jsonResponse = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });

export const formatUser = (u: UserWithMetrics, onlineUsers: OnlineEntry[] = []) => {
  const isOnline = onlineUsers.some((entry) => entry.userId === u.id);
  return {
    id: u.id,
    name: u.name ?? "Sin nombre",
    email: u.email,
    role: (u.role ?? "user") as "user" | "admin",
    status: isOnline ? "active" : (u.status ?? "inactive"),
    verified: !!u.verified,
    createdAt: u.created_at || new Date().toISOString(),
    lastLogin: u.last_login ?? null,
    lastSeen: u.last_seen ?? null,
    tasksAssigned: Number(u.tasks_assigned ?? 0),
    tasksCompleted: Number(u.tasks_completed ?? 0),
    productivityScore: Number(u.productivity_score ?? 0),
  };
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return jsonResponse({ error: "Unauthorized" }, 401);
    if (session.role !== "admin") return jsonResponse({ error: "Forbidden" }, 403);

    let onlineUsers: OnlineEntry[] = [];

    try {
      const socketUrl = `${urlService}/online-ids?t=${Date.now()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const socketRes = await fetch(socketUrl, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (socketRes.ok) {
        onlineUsers = await socketRes.json();
      }
    } catch (e) {
      console.error("Socket presence error:", e instanceof Error ? e.message : e);
    }

    const users = await tasksDb.getUsersWithMetrics();
    return jsonResponse(users.map((u) => formatUser(u, onlineUsers)));
  } catch (err) {
    console.error("GET /api/dashboard/admin/users failed:", err);
    return jsonResponse({ error: "Internal Server Error" }, 500);
  }
}
