import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analyticsDb } from "@/lib/db/analytics-db";

const errorResponse = (msg: string, status = 500, details?: any) =>
  NextResponse.json(
    { error: msg, ...(details && { technical_details: details }) },
    { status }
  );

const authCheck = async () => {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
};

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

    const ranking = await analyticsDb.getAdminTeamRanking(from, to);
    return NextResponse.json(ranking);
  } catch (error: any) {
    console.error("❌ ERROR EN GET TEAM RANKING:", error.message);
    return NextResponse.json(
      { error: "Error interno al obtener ranking del equipo", message: error.message },
      { status: 500 }
    );
  }
}
