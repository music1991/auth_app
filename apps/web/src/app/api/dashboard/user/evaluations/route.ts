import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const evaluations = await dashboardDb.getUserEvaluations(session.sub);
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

    const body = await request.json();
    const { action, data } = body;

    if (action === 'start') {
      return NextResponse.json({ success: true, message: "Evaluation started" });
    } else if (action === 'submit') {
      return NextResponse.json({ success: true, message: "Evaluation submitted" });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in evaluation action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}