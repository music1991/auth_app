import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dashboardDb } from "@/lib/dashboard-db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await getSession();
    const targetId = searchParams.get("u") || session?.userId;

    if (!targetId) return new Response("Unauthorized", { status: 401 });

    const row = await dashboardDb.getUserAvatar(targetId);

    // Si la fila no existe o el blob es nulo en la DB
    if (!row || !row.avatar_blob) {
      return new Response(null, { status: 404 });
    }

    // Convertimos los bytes de Neon a un Buffer binario
    const body = Buffer.from(row.avatar_blob);

    return new Response(body, {
      status: 200,
      headers: {
        // Usamos el MIME guardado que ya vimos que en Neon está bien (image/jpeg)
        "Content-Type": row.avatar_mime || "image/jpeg",
        "Content-Length": String(body.length),
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}




export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Capturamos el MIME real que viene del Hook/Service
    const contentType = req.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await req.arrayBuffer());

    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    await dashboardDb.updateUserAvatar(session.userId, buffer, contentType);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dashboardDb.deleteUserAvatar(session.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
