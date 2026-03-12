import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const evaluations = await dashboardDb.getUserEvaluations(userId);

    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Error fetching user evaluations:", error); 
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

    const userId = session.userId;
    const body = await request.json();
    const { action, data } = body;

    if (action === "start") {
      await dashboardDb.startEvaluation(data.evaluationId, userId);
      return NextResponse.json({ success: true });
    }

    if (action === "submit") {
      await dashboardDb.submitEvaluation({
        evaluationId: data.evaluationId,
        userId,
        responses: data.responses,
        score: data.score,
        maxScore: data.maxScore,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
 } catch (error: any) {
    console.error("Error in evaluation action:", error);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);

    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}