import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { tasksDb } from "@/lib/tasks-db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const taskId = id;

    if (!taskId) {
      return NextResponse.json({ error: "Task id is required" }, { status: 400 });
    }

    const task = await tasksDb.getUserTaskById(session.userId, taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching user task detail:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        detail: error,
      },
      { status: 500 }
    );
  }
}