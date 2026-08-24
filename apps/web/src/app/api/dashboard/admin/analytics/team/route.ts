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

/** Validates and returns YYYY-MM-DD date string. */
function parseDate(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const from = parseDate(searchParams.get("from"));
    const to   = parseDate(searchParams.get("to"));

    if (!from || !to) {
      return errorResponse("Parámetros 'from' y 'to' son requeridos (formato YYYY-MM-DD)", 400);
    }

    const stats = await analyticsDb.getAdminTeamStats(from, to);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error en GET team analytics:", error);
    return errorResponse(`Error interno al obtener estadísticas del equipo: ${error.message}`);
  }
}
