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

export type DbDataUser = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  street: string | null;
  apartment: string | null;
  postal_code: string | null;
  avatar_url: string | null;
  avatar_blob: Uint8Array | null;
  avatar_mime: string | null;
  created_at: string;
  updated_at: string;
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


  async getDataUserByUserId(user_id: string): Promise<DbDataUser | null> {
    assertNonEmpty(user_id, "user_id");
    const rows = await sql<DbDataUser>`
      SELECT
        id, user_id, first_name, last_name, phone, bio,
        country, city, street, apartment, postal_code, avatar_url,
        created_at, updated_at
      FROM data_user
      WHERE user_id = ${user_id}
      LIMIT 1
    `;
    return rows[0] ?? null;
  },

  async upsertDataUser(args: {
  user_id: string;
  first_name?: string | null; // ahora opcionales para permitir updates parciales
  last_name?: string | null;
  phone?: string | null;
  bio?: string | null;
  country?: string | null;
  city?: string | null;
  street?: string | null;
  apartment?: string | null;
  postal_code?: string | null;
  avatar_url?: string | null;
}): Promise<DbDataUser> {
  assertNonEmpty(args.user_id, "user_id");

  // Normaliza undefined -> null para poder usar COALESCE en el UPSERT
  const a = {
    user_id: args.user_id,
    first_name: args.first_name ?? null,
    last_name: args.last_name ?? null,
    phone: args.phone ?? null,
    bio: args.bio ?? null,
    country: args.country ?? null,
    city: args.city ?? null,
    street: args.street ?? null,
    apartment: args.apartment ?? null,
    postal_code: args.postal_code ?? null,
    avatar_url: args.avatar_url ?? null,
  };

  // Si es INSERT, al menos first_name y last_name deben existir (NOT NULL en la tabla).
  // Si la fila ya existe, el ON CONFLICT + COALESCE mantendrá los valores previos.
  const rows = await sql<DbDataUser>`
    INSERT INTO data_user (
      user_id, first_name, last_name, phone, bio,
      country, city, street, apartment, postal_code, avatar_url
    )
    VALUES (
      ${a.user_id},
      ${a.first_name},  -- para un INSERT inicial, no puede ser null
      ${a.last_name},   -- idem
      ${a.phone}, ${a.bio},
      ${a.country}, ${a.city}, ${a.street}, ${a.apartment}, ${a.postal_code}, ${a.avatar_url}
    )
    ON CONFLICT ON CONSTRAINT data_user_user_id_unique
    DO UPDATE SET
      first_name  = COALESCE(EXCLUDED.first_name,  data_user.first_name),
      last_name   = COALESCE(EXCLUDED.last_name,   data_user.last_name),
      phone       = COALESCE(EXCLUDED.phone,       data_user.phone),
      bio         = COALESCE(EXCLUDED.bio,         data_user.bio),
      country     = COALESCE(EXCLUDED.country,     data_user.country),
      city        = COALESCE(EXCLUDED.city,        data_user.city),
      street      = COALESCE(EXCLUDED.street,      data_user.street),
      apartment   = COALESCE(EXCLUDED.apartment,   data_user.apartment),
      postal_code = COALESCE(EXCLUDED.postal_code, data_user.postal_code),
      avatar_url  = COALESCE(EXCLUDED.avatar_url,  data_user.avatar_url),
      updated_at  = now()
    RETURNING
      id, user_id, first_name, last_name, phone, bio,
      country, city, street, apartment, postal_code, avatar_url,
      created_at, updated_at
  `;

  return rows[0];
}
,
  async ping(): Promise<boolean> {
    const rows = await sql<{ one: number }>`SELECT 1 as one`;
    return rows?.[0]?.one === 1;
  },

  async listDataUsers(limit = 20): Promise<DbDataUser[]> {
    const rows = await sql<DbDataUser>`
      SELECT
        id, user_id, first_name, last_name, phone, bio,
        country, city, street, apartment, postal_code, avatar_url,
        created_at, updated_at
      FROM data_user
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows;
  },

  // Optional: user + data_user in one call (LEFT JOIN)
async getUserWithDataById(
  id: string
): Promise<(DbUser & { data: DbDataUser | null }) | null> {
  assertNonEmpty(id, "id");

  const rows = await sql<{
    // users (base)
    id: string;
    name: string | null;
    last_name: string | null;
    email: string;
    password_hash: string;
    role: "user" | "admin";
    verified: boolean;
    created_at: string;

    // data_user (nullable)
    data_id: string | null;
    user_id: string | null;       // du.user_id
    first_name: string | null;    // du.first_name
    data_last_name: string | null; // du.last_name AS data_last_name
    phone: string | null;
    bio: string | null;
    country: string | null;
    city: string | null;
    street: string | null;
    apartment: string | null;
    postal_code: string | null;
    avatar_blob: string | null;

    data_created_at: string | null;
    data_updated_at: string | null;
  }>`
    SELECT
      u.id,
      u.name,
      u.last_name,
      u.email,
      u.password_hash,
      u.role,
      u.verified,
      u.created_at,

      du.id            AS data_id,
      du.user_id       AS user_id,
      du.first_name    AS first_name,
      du.last_name     AS data_last_name,
      du.phone         AS phone,
      du.bio           AS bio,
      du.country       AS country,
      du.city          AS city,
      du.street        AS street,
      du.apartment     AS apartment,
      du.postal_code   AS postal_code,
      du.avatar_blob    AS avatar_blob,
      du.created_at    AS data_created_at,
      du.updated_at    AS data_updated_at
    FROM users u
    LEFT JOIN data_user du ON du.user_id = u.id
    WHERE u.id = ${id}
    LIMIT 1
  `;

  const r = rows[0];
  if (!r) return null;

  const base: DbUser = {
    id: r.id,
    name: r.name,
    last_name: r.last_name,
    email: r.email,
    password_hash: r.password_hash,
    role: r.role,
    verified: r.verified,
    created_at: r.created_at,
  };

  const data: DbDataUser | null = r.data_id
    ? {
        id: r.data_id!,
        user_id: r.user_id!,
        first_name: r.first_name!,
        last_name: r.data_last_name!, // <- alias para no chocar con users.last_name
        phone: r.phone,
        bio: r.bio,
        country: r.country,
        city: r.city,
        street: r.street,
        apartment: r.apartment,
        postal_code: r.postal_code,
        avatar_blob: r.avatar_blob,
        created_at: r.data_created_at!,
        updated_at: r.data_updated_at!,
      }
    : null;

  return { ...base, data };
},
  async setAvatarBlobForUser(user_id: string, blob: Uint8Array, mime: string): Promise<void> {
    assertNonEmpty(user_id, "user_id");
    assertNonEmpty(mime, "mime");

    await sql`
      INSERT INTO data_user (user_id, first_name, last_name, avatar_blob, avatar_mime)
      VALUES (${user_id}, '', '', ${blob}, ${mime})
      ON CONFLICT (user_id) DO UPDATE SET
        avatar_blob = EXCLUDED.avatar_blob,
        avatar_mime = EXCLUDED.avatar_mime,
        updated_at  = now()
    `;
  },

    // Retorna el blob y el mime (para servir el archivo)
  async getAvatarBlobByUserId(user_id: string): Promise<{ avatar_blob: Uint8Array | null; avatar_mime: string | null } | null> {
    assertNonEmpty(user_id, "user_id");
    const rows = await sql<{ avatar_blob: any; avatar_mime: string | null }>`
      SELECT avatar_blob, avatar_mime
      FROM data_user
      WHERE user_id = ${user_id}
      LIMIT 1
    `;
    // Nota: 'any' para avatar_blob por diferencias de tipo (Buffer/Uint8Array) según entorno.
    return rows[0] ?? null;
  },

  // Borra el avatar binario (lo deja en NULL)
  async clearAvatarBlobByUserId(user_id: string): Promise<void> {
    assertNonEmpty(user_id, "user_id");
    await sql`
      UPDATE data_user
      SET avatar_blob = NULL, avatar_mime = NULL, updated_at = now()
      WHERE user_id = ${user_id}
    `;
  },

};


