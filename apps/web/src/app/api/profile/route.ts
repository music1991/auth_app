import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ProfileSchema = z.object({
    firstName: z.string().min(1, "Required").max(60),
    lastName: z.string().min(1, "Required").max(60),
    phone: z.string().max(40).optional().nullable(),
    bio: z.string().max(500).optional().nullable(),
    country: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    street: z.string().optional().nullable(),
    apartment: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    avatarUrl: z.string().url().optional().nullable().or(z.literal("")).optional(),
});

export async function GET() {
    try {
        const session = await getSession();
        if (!session)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const result = await db.getUserWithDataById(session.userId);
        if (!result)
            return NextResponse.json({ error: "User not found" }, { status: 404 });

        const res = NextResponse.json({
            user: {
                id: result.id,
                username: result.name,
                email: result.email,
                role: result.role,
                verified: result.verified,
                created_at: result.created_at,
            },
            profile: result.data,
        });
        res.headers.set("Cache-Control", "no-store");
        return res;
    } catch (err) {
        console.error("GET /api/profile failed:", err);
        const r = NextResponse.json({ error: "Internal error" }, { status: 500 });
        r.headers.set("Cache-Control", "no-store");
        return r;
    }
}

// export async function GET() {
//   try {
//     const ok = await db.ping();
//     if (!ok) {
//       const r = NextResponse.json({ error: "DB ping failed" }, { status: 500 });
//       r.headers.set("Cache-Control", "no-store");
//       return r;
//     }

//     const rows = await db.listDataUsers(50);
//     const r = NextResponse.json({ ok: true, count: rows.length, rows });
//     r.headers.set("Cache-Control", "no-store");
//     return r;
//   } catch (err: any) {
//     console.error("GET /api/data-user failed:", err);
//     const r = NextResponse.json(
//       { error: "Internal error", detail: String(err?.message ?? err) },
//       { status: 500 }
//     );
//     r.headers.set("Cache-Control", "no-store");
//     return r;
//   }
// }

export async function PATCH(req: Request) {
    try {
        const session = await getSession();

        if (!session)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json().catch(() => ({}));
        const parsed = ProfileSchema.safeParse(body);
        if (!parsed.success)
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten() },
                { status: 400 }
            );

        const p = parsed.data;

        if (!p.firstName.trim() || !p.lastName.trim()) {
            return NextResponse.json({ error: "Name fields are required" }, { status: 400 });
        }

        const saved = await db.upsertDataUser({
            user_id: session.userId,
            first_name: p.firstName,
            last_name: p.lastName,
            phone: p.phone ?? null,
            bio: p.bio ?? null,
            country: p.country ?? null,
            city: p.city ?? null,
            street: p.street ?? null,
            apartment: p.apartment ?? null,
            postal_code: p.postalCode ?? null,
            avatar_url: p.avatarUrl || null,
        });

        const r = NextResponse.json({ profile: saved }, { status: 200 });
        r.headers.set("Cache-Control", "no-store");
        return r;
    } catch (err) {
        console.error("PATCH /api/profile failed:", err);
        const r = NextResponse.json({ error: "Internal error" }, { status: 500 });
        
        r.headers.set("Cache-Control", "no-store");
        return r;
    }
}
