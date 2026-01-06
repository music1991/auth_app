import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await dashboardDb.getAdminStats();
    return NextResponse.json(stats);
  } catch (error: any) {
   console.error("🚨 ADMIN STATS BACKEND ERROR:", error);

  return NextResponse.json(
    {
      error: error?.message ?? String(error),
      stack: error?.stack,
    },
    { status: 500 }
  );
  }
}
