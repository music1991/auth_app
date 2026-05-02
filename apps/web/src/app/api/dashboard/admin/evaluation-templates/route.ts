import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { evaluationsDb } from "@/lib/db/evaluations-db";

// --- HELPERS DE RESPUESTA ---
const errorResponse = (msg: string, status = 500, details?: any) => 
  NextResponse.json({ error: msg, ...(details && { technical_details: details }) }, { status });

const authCheck = async () => {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
};

// --- HANDLERS ---

// GET: Obtener plantillas y estadÃ­sticas
export async function GET() {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const evaluations = await evaluationsDb.getEvaluationTemplatesWithStats();
    return NextResponse.json({ evaluations });
 } catch (error: any) {
    // 1. Log detallado en la terminal (importante para Neon/Postgres)
    console.error("âŒ ERROR EN GET USER EVALUATIONS:");
    console.error("Mensaje:", error.message);
    console.error("CÃ³digo DB:", error.code); // CÃ³digo de error de Postgres (ej: 42P01)
    console.error("Stack:", error.stack);

    // 2. Respuesta con detalles para el Frontend (solo en desarrollo)
    return NextResponse.json(
      { 
        error: "Error interno al obtener evaluaciones", 
        message: error.message,
        code: error.code,
        // Esto te dirÃ¡ si el problema es la query o la conexiÃ³n
        hint: error.hint || "Verifica que la funciÃ³n getUserEvaluations exista en dashboard-db"
      }, 
      { status: 500 }
    );
  }
}
// POST: Crear la evaluaciÃ³n
export async function POST(request: NextRequest) {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const data = await request.json();

    // AquÃ­ solo creamos el recurso
    const templateId = await evaluationsDb.createEvaluationTemplate({
      title: data.title,
      description: data.description,
      type: data.type,
      dueDate: data.dueDate,
      googleFormId: data.google_form_id,
      createdBy: session.userId,
      online: data.online,
      maxScore: data.max_score,
    });

    return NextResponse.json({ success: true, templateId }, { status: 201 });

  } catch (error: any) {
    console.error("âŒ ERROR AL CREAR EVALUACIÃ“N:", error.message);
    return errorResponse("Error al crear el template", 500, error.message);
  }
}

// PATCH: (Comentado) Para publicar o cambiar estados en el futuro
/*
export async function PATCH(request: NextRequest) {
  const session = await authCheck();
  if (!session) return errorResponse("Unauthorized", 401);

  const { id, action } = await request.json();
  
  if (action === 'publish') {
     await evaluationsDb.publishEvaluationTemplate(id);
     return NextResponse.json({ success: true });
  }
  
  return errorResponse("Invalid action", 400);
}
*/


export async function PUT(request: NextRequest) {
  try {
    const session = await authCheck();
    if (!session) return errorResponse("Unauthorized", 401);

    const { templateId } = await request.json();

    if (!templateId) {
      return errorResponse("Template ID is required", 400);
    }

    await evaluationsDb.publishEvaluationTemplate(templateId);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("âŒ ERROR AL PUBLICAR EVALUACIÃ“N:", error.message);
    return errorResponse("Error al publicar el template", 500, error.message);
  }
}
