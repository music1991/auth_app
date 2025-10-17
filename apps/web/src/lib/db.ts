import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;

export type DbUser = {
  id: string;
  name: string | null;
  email: string;
  password_hash: string;
  role: "user" | "admin";
  verified: boolean;
  created_at: string;
};

export type DbVerification = {
  id: string;
  user_id: string;
  code: string;
  consumed: boolean;
  expires_at: string;
};

interface SqlTag {
  <T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]>;
}

let _sql: SqlTag | null = null;

function getSql(): SqlTag {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  _sql = neon(url) as unknown as SqlTag;
  return _sql;
}

export const sql: SqlTag = (<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
) => (getSql() as any)(strings, ...values)) as SqlTag;

function normEmail(e: string) {
  return String(e || "").trim().toLowerCase();
}
function assertNonEmpty(value: string, field: string) {
  if (!value || !value.trim()) throw new Error(`${field} is required`);
}

export const db = {
  async getUserByEmail(email: string): Promise<DbUser | null> {
    const em = normEmail(email);
    const rows = await sql<DbUser>`
      SELECT id, name, email, password_hash, role, verified, created_at
      FROM users
      WHERE lower(email) = ${em}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async getUserById(id: string): Promise<DbUser | null> {
    assertNonEmpty(id, "id");
    const rows = await sql<DbUser>`
      SELECT id, name, email, password_hash, role, verified, created_at
      FROM users
      WHERE id = ${id}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async insertUser(u: {
    id: string;
    name: string | null;
    email: string;
    password_hash: string;
    role: "user" | "admin";
  }): Promise<void> {
    assertNonEmpty(u.id, "id");
    assertNonEmpty(u.email, "email");
    assertNonEmpty(u.password_hash, "password_hash");
    const em = normEmail(u.email);

    await sql`
      INSERT INTO users (id, name, email, password_hash, role, verified)
      VALUES (${u.id}, ${u.name}, ${em}, ${u.password_hash}, ${u.role}, false)
      ON CONFLICT (id) DO NOTHING
    `;
  },

  async listUsers(): Promise<
    Pick<DbUser, "id" | "name" | "email" | "role" | "verified" | "created_at">[]
  > {
    const rows = await sql<
      Pick<DbUser, "id" | "name" | "email" | "role" | "verified" | "created_at">
    >`
      SELECT id, name, email, role, verified, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    return rows;
  },

  async markVerifiedByEmail(email: string): Promise<void> {
    const em = normEmail(email);
    await sql`UPDATE users SET verified = true WHERE lower(email) = ${em}`;
  },

  async markVerifiedById(id: string): Promise<void> {
    assertNonEmpty(id, "id");
    await sql`UPDATE users SET verified = true WHERE id = ${id}`;
  },

  async deleteUserById(id: string): Promise<void> {
    assertNonEmpty(id, "id");
    await sql`DELETE FROM users WHERE id = ${id}`;
  },

  async upsertVerificationForUser(v: {
    id: string;
    user_id: string;
    code: string;
    expiresAt: Date;
  }): Promise<void> {
    assertNonEmpty(v.id, "id");
    assertNonEmpty(v.user_id, "user_id");
    if (!/^\d{6}$/.test(v.code)) throw new Error("code must be 6 digits");

    const expIso = v.expiresAt.toISOString();

    await sql`BEGIN`;
    try {
      await sql`DELETE FROM verifications WHERE user_id = ${v.user_id}`;
      await sql`
        INSERT INTO verifications (id, user_id, code, consumed, expires_at)
        VALUES (${v.id}, ${v.user_id}, ${v.code}, false, ${expIso})
      `;
      await sql`COMMIT`;
    } catch (e) {
      await sql`ROLLBACK`;
      throw e;
    }
  },

  async getLatestValidVerificationByUserId(
    user_id: string,
    now: Date
  ): Promise<DbVerification | null> {
    assertNonEmpty(user_id, "user_id");
    const nowIso = now.toISOString();
    const rows = await sql<DbVerification>`
      SELECT id, user_id, code, consumed, expires_at
      FROM verifications
      WHERE user_id = ${user_id}
        AND consumed = false
        AND expires_at > ${nowIso}
      ORDER BY expires_at DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async consumeAllForUserId(user_id: string): Promise<void> {
    assertNonEmpty(user_id, "user_id");
    await sql`UPDATE verifications SET consumed = true WHERE user_id = ${user_id}`;
  },

  async deleteVerificationsByUserId(user_id: string): Promise<void> {
    assertNonEmpty(user_id, "user_id");
    await sql`DELETE FROM verifications WHERE user_id = ${user_id}`;
  },
};
