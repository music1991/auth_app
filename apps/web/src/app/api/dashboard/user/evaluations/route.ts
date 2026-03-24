import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

const urlServer = process.env.NEXT_PUBLIC_SERVICES_URL; 

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const evaluations = await dashboardDb.getUserEvaluations(userId);

    return NextResponse.json({ evaluations });
  } catch (error: any) {
    // 1. Log detallado en la terminal (importante para Neon/Postgres)
    console.error("❌ ERROR EN GET USER EVALUATIONS:");
    console.error("Mensaje:", error.message);
    console.error("Código DB:", error.code); // Código de error de Postgres (ej: 42P01)
    console.error("Stack:", error.stack);

    // 2. Respuesta con detalles para el Frontend (solo en desarrollo)
    return NextResponse.json(
      { 
        error: "Error interno al obtener evaluaciones", 
        message: error.message,
        code: error.code,
        // Esto te dirá si el problema es la query o la conexión
        hint: error.hint || "Verifica que la función getUserEvaluations exista en dashboard-db"
      }, 
      { status: 500 }
    );
  }
}

/* export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const body = await request.json();
    const { action, data } = body;

    if (action === "submit") {
      await dashboardDb.submitEvaluation({
        evaluationId: data.evaluationId,
        userId,
        responses: data.responses,
        score: data.score,
        maxScore: data.maxScore,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
 } catch (error: any) {
    console.error("Error in evaluation action:", error);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);

    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
} */

export async function PATCH(request: NextRequest) {
  const { evaluationId, status } = await request.json();
  
  // URL de tu servidor Node/Express desde el .env


  const response = await fetch(`${urlServer}/form/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evaluationId, status })
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}