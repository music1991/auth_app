import { NextRequest, NextResponse } from "next/server";
import { dashboardDb } from "@/lib/dashboard-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Estos nombres deben coincidir con lo que envías desde Apps Script
    const { email, score, form_id } = body;

    // Validación básica de datos recibidos
    if (!email || !form_id || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: email, score, or form_id" },
        { status: 400 }
      );
    }

    console.log(`Recibido score de ${email} para el form ${form_id}: ${score}`);

    // Llamamos a una nueva función en tu librería de base de datos
    const result = await dashboardDb.updateEvaluationScoreByEmailAndForm({
      email,
      score: Number(score),
      googleFormId: form_id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Puntaje actualizado correctamente" 
    });

  } catch (error) {
    console.error("Error en Webhook de Google Forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
