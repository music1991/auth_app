import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { evaluationsDb } from "@/lib/evaluations-db";

const errorResponse = (msg: string, status = 500) => 
  NextResponse.json({ error: msg }, { status });

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { templateId, userIds, dueDate } = await request.json();

    if (!templateId || !userIds || !Array.isArray(userIds)) {
      return errorResponse("Faltan datos requeridos (templateId o userIds)", 400);
    }

    await evaluationsDb.assignEvaluationTemplateToUsers({
      templateId,
      userIds,
      assignedBy: session.userId,
      dueDate: dueDate ?? null,
    });

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error: any) {
    console.error("❌ ERROR AL ASIGNAR EVALUACIÓN:", error.message);
    
    return NextResponse.json(
      { 
        error: "Error interno al asignar la evaluación", 
        technical_details: error.message 
      }, 
      { status: 500 }
    );
  }
}

// =========================
// GET: Obtener usuarios asignados a un template
// =========================
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) return errorResponse("templateId es requerido", 400);

    const users = await evaluationsDb.getAssignedUsersByTemplate(templateId);

    // Formateo uniforme
    const formatted = users.map(u => ({
      id: u.id,
      evaluationId: u.evaluationId,
      name: u.name,
      email: u.email,
      isCompleted: !!u.isCompleted
    }));

    return NextResponse.json(formatted);

  } catch (error: any) {
    console.error("❌ ERROR GET assigned users:", error.message);
    return errorResponse(error.message);
  }
}

// =========================
// PUT: Desasignar usuario de una evaluación
// =========================
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return errorResponse("Unauthorized", 401);

    const { templateId, userId } = await request.json();

    if (!templateId || !userId) {
      return errorResponse("templateId y userId son requeridos", 400);
    }

    const deleted = await evaluationsDb.unassignUserFromEvaluation(templateId, userId);

    if (!deleted) {
      return errorResponse(
        "No se pudo desasignar (quizás ya completó la evaluación)", 
        400
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ ERROR PUT unassign user:", error.message);
    return errorResponse(error.message);
  }
}