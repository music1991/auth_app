import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trainingDb } from "@/lib/training-db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await trainingDb.deleteProvider(Number(id));
  return NextResponse.json({ success: true });
}
