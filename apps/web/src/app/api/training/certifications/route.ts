import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trainingDb } from "@/lib/training-db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "admin") {
    const certifications = await trainingDb.getAllCertifications();
    return NextResponse.json({ certifications });
  }

  const certifications = await trainingDb.getUserCertifications(session.userId);
  return NextResponse.json({ certifications });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { courseId, enrollmentId, title, issuer, issuedDate, expiryDate, credentialUrl, fileUrl } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!credentialUrl && !fileUrl) {
    return NextResponse.json({ error: "credentialUrl or fileUrl is required" }, { status: 400 });
  }

  const id = await trainingDb.createCertification({
    userId: session.userId,
    courseId,
    enrollmentId,
    title: title.trim(),
    issuer,
    issuedDate,
    expiryDate,
    credentialUrl,
    fileUrl,
  });

  return NextResponse.json({ id }, { status: 201 });
}
