import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trainingDb } from "@/lib/db/training-db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { userIds } = body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "userIds must be a non-empty array" }, { status: 400 });
  }

  await trainingDb.enrollUsersInLine({
    trainingLineId: id,
    userIds,
    assignedBy: session.userId,
  });

  return NextResponse.json({ success: true });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const enrollments = await trainingDb.getTrainingLineEnrollments(id);
  return NextResponse.json({ enrollments });
}
