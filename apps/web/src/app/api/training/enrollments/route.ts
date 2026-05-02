import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trainingDb } from "@/lib/db/training-db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lines = await trainingDb.getUserTrainingLines(session.userId);
  return NextResponse.json({ lines });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, data } = body;

  if (action === "complete-course") {
    await trainingDb.updateCourseEnrollmentStatus({
      userId: session.userId,
      courseId: data.courseId,
      trainingLineId: data.trainingLineId ?? null,
      status: "completed",
    });

    if (data.trainingLineId) {
      await trainingDb.recalculateProgress(session.userId, data.trainingLineId);
    }

    return NextResponse.json({ success: true });
  }

  if (action === "enroll-course") {
    const enrollmentId = await trainingDb.enrollUserInCourse({
      userId: session.userId,
      courseId: data.courseId,
      trainingLineId: data.trainingLineId ?? null,
    });
    return NextResponse.json({ enrollmentId });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

