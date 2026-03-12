import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const tasks = await dashboardDb.getUserTasks(userId);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching user tasks:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, status, progress, details } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      );
    }

    const userId = session.userId;

    const task = await dashboardDb.getTaskById(taskId);

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    if (task.user_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const allowedStatuses = ["pending", "in-progress", "completed"];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const safeProgress =
      typeof progress === "number"
        ? Math.max(0, Math.min(100, progress))
        : undefined;

    await dashboardDb.updateUserTask(taskId, {
      status,
      progress: safeProgress,
      userNotes: details.userNotes,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user task:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}