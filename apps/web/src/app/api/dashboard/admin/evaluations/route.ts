import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const evaluationTemplates = await dashboardDb.getEvaluationTemplates();
    return NextResponse.json({ evaluationTemplates });
  } catch (error) {
    console.error("Error fetching evaluation templates:", error);
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
      const templateId = await dashboardDb.createEvaluationTemplate({
        title: data.title,
        description: data.description,
        type: data.type,
        createdBy: session.sub,
        dueDate: data.dueDate
      });
      return NextResponse.json({ templateId, success: true });
    } else if (action === 'assign-evaluation') {
      const evaluationId = await dashboardDb.assignEvaluation({
        templateId: data.templateId,
        userId: data.userId,
        assignedBy: session.sub,
        dueDate: data.dueDate
      });
      return NextResponse.json({ evaluationId, success: true });
    } else if (action === 'publish-evaluation') {
      await dashboardDb.publishEvaluation(data.templateId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in admin evaluation action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}