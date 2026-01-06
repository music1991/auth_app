import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [activeSession, workSessions] = await Promise.all([
      dashboardDb.getActiveWorkSession(session.sub),
      dashboardDb.getWorkSessions(session.sub, 20)
    ]);

    return NextResponse.json({
      activeSession,
      workSessions
    });
  } catch (error) {
    console.error("Error fetching work sessions:", error);
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
      const sessionId = await dashboardDb.startWorkSession(session.sub);
      return NextResponse.json({ sessionId, success: true });
    } else if (action === 'end') {
      await dashboardDb.endWorkSession(data.sessionId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in work session action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}