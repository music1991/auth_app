import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

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

    await dashboardDb.assignEvaluationTemplateToUsers({
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
