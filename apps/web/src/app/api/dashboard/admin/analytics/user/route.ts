import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

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

// --- GET: lista simple de usuarios para filtros del módulo analytics ---
export async function GET() {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const users = await dashboardDb.getAnalyticsUsers();

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("❌ ERROR EN GET ANALYTICS USERS:");
    console.error("Mensaje:", error.message);
    console.error("Código DB:", error.code);
    console.error("Stack:", error.stack);

    return NextResponse.json(
      {
        error: "Error interno al obtener usuarios para analytics",
        message: error.message,
        code: error.code,
        hint:
          error.hint ||
          "Verifica que exista dashboardDb.getAnalyticsUsers()",
      },
      { status: 500 }
    );
  }
}