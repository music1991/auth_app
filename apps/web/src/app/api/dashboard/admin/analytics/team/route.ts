import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analyticsDb } from "@/lib/db/analytics-db";

// --- HELPERS ---
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

const parsePeriod = (period: string | null) => {
  const allowed = new Set(["7d", "30d", "90d"]);
  return allowed.has(period || "") ? period! : "30d";
};

// --- GET: estadÃ­sticas globales del equipo ---
export async function GET(request: NextRequest) {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get("period"));

    const stats = await analyticsDb.getAdminTeamStats(period);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("âŒ ERROR EN GET TEAM ANALYTICS:");
    console.error("Mensaje:", error.message);
    console.error("CÃ³digo DB:", error.code);
    console.error("Stack:", error.stack);

    return NextResponse.json(
      {
        error: "Error interno al obtener estadÃ­sticas del equipo",
        message: error.message,
        code: error.code,
        hint:
          error.hint ||
          "Verifica que exista analyticsDb.getAdminTeamStats(period)",
      },
      { status: 500 }
    );
  }
}
