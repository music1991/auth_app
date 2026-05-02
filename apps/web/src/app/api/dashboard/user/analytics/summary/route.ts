import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analyticsDb } from "@/lib/analytics-db";

// --- HELPERS ---
const errorResponse = (msg: string, status = 500, details?: any) =>
  NextResponse.json(
    { error: msg, ...(details && { technical_details: details }) },
    { status }
  );

const authCheck = async () => {
  const session = await getSession();
  if (!session || session.role !== "user") return null;
  return session;
};

const parsePeriod = (period: string | null) => {
  const allowed = new Set(["7d", "30d", "90d"]);
  return allowed.has(period || "") ? period! : "30d";
};

// --- GET: resumen de desempeño del usuario autenticado ---
export async function GET(request: NextRequest) {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const period = parsePeriod(searchParams.get("period"));

    const data = await analyticsDb.getUserOwnPerformance(
      session.userId,
      period
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ ERROR EN GET USER ANALYTICS SUMMARY:");
    console.error("Mensaje:", error.message);
    console.error("Código DB:", error.code);
    console.error("Stack:", error.stack);

    return NextResponse.json(
      {
        error: "Error interno al obtener el resumen de desempeño",
        message: error.message,
        code: error.code,
        hint:
          error.hint ||
          "Verifica que exista analyticsDb.getUserOwnPerformance(userId, period)",
      },
      { status: 500 }
    );
  }
}