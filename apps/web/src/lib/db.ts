import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.fetchConnectionCache = true;

export type DbUser = {
  id: string;
  name: string | null;
  last_name: string | null;
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

export type DbPasswordReset = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
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
      SELECT id, name, last_name, email, password_hash, role, verified, created_at
      FROM users
      WHERE lower(email) = ${em}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async getUserById(id: string): Promise<DbUser | null> {
    assertNonEmpty(id, "id");
    const rows = await sql<DbUser>`
      SELECT id, name, last_name, email, password_hash, role, verified, created_at
      FROM users
      WHERE id = ${id}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async insertUser(u: {
    id: string;
    name: string | null;
    last_name: string | null;
    email: string;
    password_hash: string;
    role: "user" | "admin";
  }): Promise<void> {
    assertNonEmpty(u.id, "id");
    assertNonEmpty(u.email, "email");
    assertNonEmpty(u.password_hash, "password_hash");
    const em = normEmail(u.email);

    await sql`
      INSERT INTO users (id, name, last_name, email, password_hash, role, verified)
      VALUES (${u.id}, ${u.name}, ${u.last_name}, ${em}, ${u.password_hash}, ${u.role}, false)
      ON CONFLICT (id) DO NOTHING
    `;
  },

  async listUsers(): Promise<
    Pick<DbUser, "id" | "name" | "last_name" | "email" | "role" | "verified" | "created_at">[]
  > {
    const rows = await sql<
      Pick<DbUser, "id" | "name" | "last_name" | "email" | "role" | "verified" | "created_at">
    >`
      SELECT id, name, last_name, email, role, verified, created_at
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

  async insertPasswordReset(args: {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
  }): Promise<void> {
    assertNonEmpty(args.id, "id");
    assertNonEmpty(args.user_id, "user_id");
    assertNonEmpty(args.token_hash, "token_hash");

    await sql`
      INSERT INTO password_resets (id, user_id, token_hash, expires_at)
      VALUES (${args.id}, ${args.user_id}, ${args.token_hash}, ${args.expires_at.toISOString()})
    `;
  },

  async getPasswordResetByHash(token_hash: string): Promise<DbPasswordReset | null> {
    assertNonEmpty(token_hash, "token_hash");
    const rows = await sql<DbPasswordReset>`
      SELECT id, user_id, token_hash, expires_at, used_at, created_at
      FROM password_resets
      WHERE token_hash = ${token_hash}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  // async markPasswordResetUsed(id: string): Promise<void> {
  //   assertNonEmpty(id, "id");
  //   await sql`UPDATE password_resets SET used_at = now() WHERE id = ${id}`;
  // },

  // async deleteExpiredResets(olderThanIso: string): Promise<void> {
  //   await sql`
  //     DELETE FROM password_resets
  //     WHERE expires_at < ${olderThanIso}
  //   `;
  // },

  async updateUserPassword(user_id: string, password_hash: string): Promise<void> {
    assertNonEmpty(user_id, "user_id");
    assertNonEmpty(password_hash, "password_hash");
    await sql`
      UPDATE users
      SET password_hash = ${password_hash}
      WHERE id = ${user_id}
    `;
  },

  async consumeResetAndUpdatePassword(reset_id: string, new_password_hash: string): Promise<boolean> {
    assertNonEmpty(reset_id, "reset_id");
    assertNonEmpty(new_password_hash, "new_password_hash");

    await sql`BEGIN`;
    try {
      const pr = await sql<DbPasswordReset>`
        SELECT id, user_id, token_hash, expires_at, used_at, created_at
        FROM password_resets
        WHERE id = ${reset_id}
        FOR UPDATE
      `;

      const row = pr[0];
      if (!row) { await sql`ROLLBACK`; return false; }
      const isExpired = new Date(row.expires_at).getTime() < Date.now();
      const isUsed = !!row.used_at;

      if (isExpired || isUsed) {
        await sql`ROLLBACK`;
        return false;
      }

      await sql`
        UPDATE users
        SET password_hash = ${new_password_hash}
        WHERE id = ${row.user_id}
      `;

      await sql`
        UPDATE password_resets
        SET used_at = now()
        WHERE id = ${row.id}
      `;

      await sql`COMMIT`;
      return true;
    } catch (e) {
      await sql`ROLLBACK`;
      throw e;
    }
  },
};
