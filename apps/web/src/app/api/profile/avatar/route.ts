import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sql } from "@/lib/db"; // tu SqlTag ya exportado
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Toma el content-type del propio request
    const contentType = req.headers.get("content-type") || "application/octet-stream";

    // Límite 2MB (ajústalo si querés)
    const buf = Buffer.from(await req.arrayBuffer());
    if (buf.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 413 });
    }

    // UPSERT: crea fila si no existe (first_name / last_name NOT NULL)
    await sql`
      INSERT INTO data_user (user_id, first_name, last_name, avatar_blob, avatar_mime)
      VALUES (${session.sub}, '', '', ${buf}, ${contentType})
      ON CONFLICT (user_id) DO UPDATE SET
        avatar_blob = EXCLUDED.avatar_blob,
        avatar_mime = EXCLUDED.avatar_mime,
        updated_at  = now()
    `;

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("PUT /api/profile/avatar failed:", err);
    const r = NextResponse.json({ error: "Internal error" }, { status: 500 });
    r.headers.set("Cache-Control", "no-store");
    return r;
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql<{ avatar_blob: Uint8Array | null; avatar_mime: string | null }[]>`
      SELECT avatar_blob, avatar_mime
      FROM data_user
      WHERE user_id = ${session.sub}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row?.avatar_blob) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = Buffer.from(row.avatar_blob); // asegura Buffer para header length
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": row.avatar_mime || "application/octet-stream",
        "Content-Length": String(body.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/profile/avatar failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await sql`
      UPDATE data_user
      SET avatar_blob = NULL, avatar_mime = NULL, updated_at = now()
      WHERE user_id = ${session.sub}
    `;

    const r = NextResponse.json({ ok: true }, { status: 200 });
    r.headers.set("Cache-Control", "no-store");
    return r;
  } catch (err) {
    console.error("DELETE /api/profile/avatar failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}