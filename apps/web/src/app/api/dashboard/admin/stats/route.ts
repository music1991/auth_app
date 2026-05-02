import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { tasksDb } from "@/lib/db/tasks-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await tasksDb.getAdminStats();
    return NextResponse.json(stats);
  } catch (error: any) {
   console.error("ðŸš¨ ADMIN STATS BACKEND ERROR:", error);

  return NextResponse.json(
    {
      error: error?.message ?? String(error),
      stack: error?.stack,
    },
    { status: 500 }
  );
  }
}

