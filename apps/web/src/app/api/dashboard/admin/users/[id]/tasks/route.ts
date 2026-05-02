import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { tasksDb } from "@/lib/db/tasks-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonResponse = (data: any, status = 200) => {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (session.role !== "admin") {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const { id } = await context.params;

    if (!id) {
      return jsonResponse({ error: "User id is required" }, 400);
    }

    const tasks = await tasksDb.getUserTasks(id);

    return jsonResponse({ tasks: tasks ?? [] });
  } catch (err: any) {
    console.error("GET /users/[id]/tasks failed:", err.message);

    return jsonResponse(
      {
        error: "Internal Server Error",
        detail: process.env.NODE_ENV !== "production" ? err.message : undefined,
      },
      500
    );
  }
}