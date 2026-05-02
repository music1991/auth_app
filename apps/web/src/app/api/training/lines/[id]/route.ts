import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trainingDb } from "@/lib/db/training-db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [line, items] = await Promise.all([
    trainingDb.getTrainingLineById(id),
    trainingDb.getTrainingLineItems(id),
  ]);

  if (!line) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ line, items });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { sectorIds, ...lineData } = body;

  await trainingDb.updateTrainingLine(id, lineData);

  if (Array.isArray(sectorIds)) {
    await trainingDb.setTrainingLineSectors(id, sectorIds);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await trainingDb.deleteTrainingLine(id);
  return NextResponse.json({ success: true });
}
