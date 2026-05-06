import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { evaluationsDb } from "@/lib/db/evaluations-db";
import { trainingDb } from "@/lib/db/training-db";

const urlServer = process.env.NEXT_PUBLIC_SERVICES_URL;

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const evaluations = await evaluationsDb.getUserEvaluations(session.userId);
    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Error fetching user evaluations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { evaluationId, status } = await request.json();

    const response = await fetch(`${urlServer}/form/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evaluationId, status }),
    });

    const data = await response.json();

    if (response.ok && status === "completed") {
      const evaluation = await evaluationsDb.getEvaluationById(evaluationId);
      if (evaluation?.training_line_id) {
        await trainingDb.recalculateProgress(evaluation.user_id, evaluation.training_line_id);
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error updating evaluation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
