import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskTemplates = await dashboardDb.getTaskTemplates();
    return NextResponse.json({ taskTemplates });
  } catch (error) {
    console.error("Error fetching task templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (action === 'create-template') {
      const templateId = await dashboardDb.createTaskTemplate({
        title: data.title,
        description: data.description,
        type: data.type,
        estimatedHours: data.estimatedHours,
        requirements: data.requirements,
        createdBy: session.sub
      });
      return NextResponse.json({ templateId, success: true });
    } else if (action === 'assign-task') {
      const taskId = await dashboardDb.assignTask({
        templateId: data.templateId,
        userId: data.userId,
        assignedBy: session.sub,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        details: data.details
      });
      return NextResponse.json({ taskId, success: true });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in admin task action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}