import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trainingDb } from "@/lib/training-db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lines = await trainingDb.getTrainingLines();
  return NextResponse.json({ lines });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, mandatory, sectorIds } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const id = await trainingDb.createTrainingLine({
    title: title.trim(),
    description,
    mandatory,
    createdBy: session.userId,
  });

  if (Array.isArray(sectorIds) && sectorIds.length > 0) {
    await trainingDb.setTrainingLineSectors(id, sectorIds);
  }

  return NextResponse.json({ id }, { status: 201 });
}
