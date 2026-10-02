export async function acquireLease(db: D1Database, key: string, ownerId: string,
  nowMs: number, ttlMs = 10_000): Promise<boolean> {
  if (!key || !ownerId || !Number.isSafeInteger(nowMs) ||
      !Number.isInteger(ttlMs) || ttlMs < 1 || ttlMs > 60_000) {
    throw new Error('Bloqueo de refresco inválido.')
  }
  const row = await db.prepare(`INSERT INTO refresh_leases(cache_key,owner_id,expires_at)
    VALUES(?,?,?) ON CONFLICT(cache_key) DO UPDATE SET
    owner_id=excluded.owner_id, expires_at=excluded.expires_at
    WHERE refresh_leases.expires_at <= ? RETURNING owner_id`)
    .bind(key, ownerId, nowMs + ttlMs, nowMs).first<{ owner_id: string }>()
  return row?.owner_id === ownerId
}

export async function releaseLease(db: D1Database, key: string, ownerId: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM refresh_leases WHERE cache_key=? AND owner_id=?')
    .bind(key, ownerId).run()
  return (result.meta.changes ?? 0) === 1
}
