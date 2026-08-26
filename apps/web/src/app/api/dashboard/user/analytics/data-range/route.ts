import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { analyticsDb } from "@/lib/db/analytics-db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const range = await analyticsDb.getDataRange();
    return NextResponse.json(range);
  } catch (error: any) {
    console.error("Error en GET user data-range:", error);
    return NextResponse.json(
      { error: "Error al obtener rango de datos", message: error.message },
      { status: 500 }
    );
  }
}
