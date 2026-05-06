import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { tasksDb } from "@/lib/db/tasks-db";
import { trainingDb } from "@/lib/db/training-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cada usuario obtiene sus tareas asignadas
    const tasks = await tasksDb.getAssignedTasksForAdmin(); //getUserTasks ??

    return NextResponse.json({ tasks });

  } catch (error) {
    console.error("Error fetching tasks:", error);

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
    const { action, data } = body;

    // ======================================
    // ASSIGN TASK (ADMIN)
    // ======================================
    if (action === "assign-task") {

      if (session.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const taskId = await tasksDb.assignTask({
        templateId: data.templateId,
        userId: data.userId,
        assignedBy: session.userId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        trainingLineId: data.trainingLineId ?? null,
        details: data.details
      });

      return NextResponse.json({
        success: true,
        taskId
      });
    }

    // ======================================
    // UPDATE TASK STATUS
    // ======================================
    if (action === "update-task-status") {
      const task = await tasksDb.getTaskById(data.taskId);

      await tasksDb.updateTaskStatus(data.taskId, data.status);

      if (data.status === "completed" && task?.training_line_id) {
        await trainingDb.recalculateProgress(task.user_id, task.training_line_id);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error in tasks route:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
