import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { trainingDb } from "@/lib/training-db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await params;
  await trainingDb.removeTrainingLineItem(itemId);
  return NextResponse.json({ success: true });
}
