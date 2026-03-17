import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const evaluations = await dashboardDb.getEvaluationTemplatesWithStats();
    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Error fetching admin evaluations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (action === "create-template") {
      const templateId = await dashboardDb.createEvaluationTemplate({
        title: data.title,
        description: data.description,
        type: data.type,
        dueDate: data.dueDate,
        googleFormId: data.google_form_id,
        createdBy: session.userId,
      });

      return NextResponse.json({ success: true, templateId });
    }

    if (action === "publish-template") {
      await dashboardDb.publishEvaluationTemplate(data.templateId);
      return NextResponse.json({ success: true });
    }

    if (action === "assign-template") {
  await dashboardDb.assignEvaluationTemplateToUsers({
    templateId: data.templateId,
    userIds: data.userIds,
    assignedBy: session.userId,
    dueDate: data.dueDate ?? null,
  });

  return NextResponse.json({ success: true });
}

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
} catch (error: any) {
    // Esto lo verás en la terminal (si es local) o en los logs de Vercel
    console.error("❌ ERROR AL CREAR EVALUACIÓN:");
    console.error("Mensaje:", error.message);
    
    // Si usas Postgres/Neon, esto te dirá si falta una columna o hay error de sintaxis
    if (error.code) {
      console.error("Código Error Postgres:", error.code);
      console.error("Detalle DB:", error.detail || "Sin detalles adicionales");
    }

    return NextResponse.json(
      { 
        error: "Error interno al crear el template", 
        technical_details: error.message,
        hint: "Asegúrate de que la columna 'google_form_id' exista en la tabla 'evaluation_templates' en Neon"
      }, 
      { status: 500 }
    );
  }
}