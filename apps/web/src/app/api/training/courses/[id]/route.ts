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
  const course = await trainingDb.getCourseById(id);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ course });
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

  await trainingDb.updateCourse(id, body);
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
  await trainingDb.deleteCourse(id);
  return NextResponse.json({ success: true });
}
