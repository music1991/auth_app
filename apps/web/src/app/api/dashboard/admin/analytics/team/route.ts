import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analyticsDb } from "@/lib/db/analytics-db";

const errorResponse = (msg: string, status = 500) =>
  NextResponse.json({ error: msg }, { status });

const authCheck = async () => {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
};

const parsePeriod = (period: string | null) => {
  const allowed = new Set(["7d", "30d", "90d"]);
  return allowed.has(period || "") ? period! : "30d";
};

export async function GET(request: NextRequest) {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get("period"));

    const stats = await analyticsDb.getAdminTeamStats(period);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error en GET team analytics:", error);
    return errorResponse("Error interno al obtener estadísticas del equipo");
  }
}
