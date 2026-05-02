import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trainingDb } from "@/lib/training-db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const items = await trainingDb.getTrainingLineItems(id);
  return NextResponse.json({ items });
}

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
  const { itemType, courseId, evaluationTemplateId, taskTemplateId, orderIndex } = body;

  if (!["course", "evaluation", "task"].includes(itemType)) {
    return NextResponse.json({ error: "itemType must be course, evaluation, or task" }, { status: 400 });
  }
  if (orderIndex === undefined || orderIndex === null) {
    return NextResponse.json({ error: "orderIndex is required" }, { status: 400 });
  }

  const itemId = await trainingDb.addTrainingLineItem({
    trainingLineId: id,
    itemType,
    courseId,
    evaluationTemplateId,
    taskTemplateId,
    orderIndex,
  });

  return NextResponse.json({ id: itemId }, { status: 201 });
}
