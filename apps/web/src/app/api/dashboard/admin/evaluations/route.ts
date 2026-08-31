import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { evaluationsDb } from "@/lib/db/evaluations-db";

const errorResponse = (msg: string, status = 500) =>
  NextResponse.json({ error: msg }, { status });

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { templateId, userIds, dueDate } = await request.json();

    if (!templateId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse("Faltan datos requeridos (templateId o userIds)", 400);
    }

    if (dueDate !== undefined && dueDate !== null) {
      const parsed = Date.parse(dueDate);
      if (isNaN(parsed)) {
        return errorResponse("dueDate debe ser una fecha válida (YYYY-MM-DD)", 400);
      }
    }

    await evaluationsDb.assignEvaluationTemplateToUsers({
      templateId,
      userIds,
      assignedBy: session.userId,
      dueDate: dueDate ?? null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error al asignar evaluación:", error);
    return errorResponse("Error interno al asignar la evaluación");
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");
    if (!templateId) return errorResponse("templateId es requerido", 400);

    if (searchParams.get("results") === "1") {
      const results = await evaluationsDb.getEvaluationResultsByTemplate(templateId);
      return NextResponse.json(results);
    }

    const users = await evaluationsDb.getAssignedUsersByTemplate(templateId);
    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        evaluationId: u.evaluationId,
        name: u.name,
        email: u.email,
        isCompleted: !!u.isCompleted,
      }))
    );
  } catch (error) {
    console.error("Error GET assigned users:", error);
    return errorResponse("Error interno al obtener usuarios asignados");
  }
}

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
      return errorResponse("No se pudo desasignar (quizás ya completó la evaluación)", 400);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error PUT unassign user:", error);
    return errorResponse("Error interno al desasignar usuario");
  }
}
