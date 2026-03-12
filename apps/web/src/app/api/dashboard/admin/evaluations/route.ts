import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const evaluations = await dashboardDb.getEvaluationTemplatesWithStats();
    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Error fetching admin evaluations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    if (action === "create-template") {
      const templateId = await dashboardDb.createEvaluationTemplate({
        title: data.title,
        description: data.description,
        type: data.type,
        dueDate: data.dueDate,
        createdBy: session.userId,
      });

      return NextResponse.json({ success: true, templateId });
    }

    if (action === "publish-template") {
      await dashboardDb.publishEvaluationTemplate(data.templateId);
      return NextResponse.json({ success: true });
    }

    if (action === "assign-template") {
  await dashboardDb.assignEvaluationTemplateToUsers({
    templateId: data.templateId,
    userIds: data.userIds,
    assignedBy: session.userId,
    dueDate: data.dueDate ?? null,
  });

  return NextResponse.json({ success: true });
}

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in admin evaluations route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}