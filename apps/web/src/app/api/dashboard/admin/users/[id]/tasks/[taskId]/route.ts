import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { tasksDb } from "@/lib/tasks-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, taskId } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: "Task id is required" },
        { status: 400 }
      );
    }

    const task = await tasksDb.getAdminUserTaskById(id, taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching admin task detail:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
        detail: error,
      },
      { status: 500 }
    );
  }
}