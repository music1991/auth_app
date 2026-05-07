import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analyticsDb } from "@/lib/db/analytics-db";

const errorResponse = (msg: string, status = 500) =>
  NextResponse.json({ error: msg }, { status });

const authCheck = async () => {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
};

export async function GET() {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const users = await analyticsDb.getAnalyticsUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error en GET analytics users:", error);
    return errorResponse("Error interno al obtener usuarios para analytics");
  }
}
