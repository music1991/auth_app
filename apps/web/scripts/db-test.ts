import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon, neonConfig } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("❌ Falta DATABASE_URL");
  process.exit(1);
}

neonConfig.fetchConnectionCache = true;
const sql = neon(process.env.DATABASE_URL);

async function main() {
  const r = await sql/*sql*/`
    select version() as version, current_database() as db, now() as ts
  `;
  console.log("✅ Conexión OK:", r[0]);

  await sql`create table if not exists ping (id serial primary key, ts timestamptz default now())`;
  await sql`insert into ping default values`;
  const last = await sql`select id, ts from ping order by id desc limit 1`;
  console.log("🟢 Ping row:", last[0]);
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
