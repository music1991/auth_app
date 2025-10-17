import "server-only";
import { createHash } from "crypto";
import { db, type DbPasswordReset, type DbUser } from "@/lib/db";

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function findValidResetByToken(
  token: string
): Promise<DbPasswordReset | null> {
  const token_hash = hashResetToken(token);
  const row = await db.getPasswordResetByHash(token_hash);
  if (!row) return null;

  const expired = new Date(row.expires_at).getTime() < Date.now();
  const used = !!row.used_at;

  if (expired || used) return null;
  return row;
}

export async function consumeTokenAndUpdatePassword(
  token: string,
  newPasswordHash: string
): Promise<boolean> {
  const token_hash = hashResetToken(token);
  const pr = await db.getPasswordResetByHash(token_hash);
  if (!pr) return false;

  return db.consumeResetAndUpdatePassword(pr.id, newPasswordHash);
}

// export async function cleanupExpiredResets(olderThan: Date) {
//   await db.deleteExpiredResets(olderThan.toISOString());
// }
