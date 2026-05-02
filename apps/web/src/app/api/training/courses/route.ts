import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trainingDb } from "@/lib/db/training-db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courses = await trainingDb.getCourses();
  return NextResponse.json({ courses });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, source, providerId, url, durationH, costPerUser, currency } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!["internal", "external"].includes(source)) {
    return NextResponse.json({ error: "source must be internal or external" }, { status: 400 });
  }

  const id = await trainingDb.createCourse({
    title: title.trim(),
    description,
    source,
    providerId,
    url,
    durationH,
    costPerUser,
    currency,
    createdBy: session.userId,
  });

  return NextResponse.json({ id }, { status: 201 });
}

