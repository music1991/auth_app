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
  if (!session || session.role !== "user") return null;
  return session;
};

// --- GET: resumen de desempeño del usuario autenticado ---
export async function GET(request: NextRequest) {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return errorResponse(
        "Se requieren las fechas 'from' y 'to' (formato YYYY-MM-DD)",
        400
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return errorResponse("Formato de fecha inválido. Usar YYYY-MM-DD", 400);
    }

    const data = await analyticsDb.getUserOwnPerformance(
      session.userId,
      from,
      to
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
      },
      { status: 500 }
    );
  }
}
