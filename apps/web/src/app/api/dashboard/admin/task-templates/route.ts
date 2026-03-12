import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskTemplates = await dashboardDb.getTaskTemplates();

    return NextResponse.json({ taskTemplates });
  } catch (error) {
    console.error("Error fetching task templates:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    // CREATE TEMPLATE
    if (action === "create-template") {
      const templateId = await dashboardDb.createTaskTemplate({
        title: data.title,
        description: data.description,
        type: data.type,
        estimatedHours: data.estimatedHours,
        requirements: data.requirements,
        createdBy: session.userId,
      });

      return NextResponse.json({
        success: true,
        templateId,
      });
    }

    // UPDATE TEMPLATE
    if (action === "update-template") {
      await dashboardDb.updateTaskTemplate(data.id, {
        title: data.title,
        description: data.description,
        type: data.type,
        estimatedHours: data.estimatedHours,
        requirements: data.requirements,
      });

      return NextResponse.json({
        success: true,
      });
    }

    // DELETE TEMPLATE
    if (action === "delete-template") {
      await dashboardDb.deleteTaskTemplate(data.id);

      return NextResponse.json({
        success: true,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error fetching task templates:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}