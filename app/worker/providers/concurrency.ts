export async function acquireProviderSlot(db: D1Database, provider: string, ownerId: string,
  nowMs: number, maxConcurrency = 3): Promise<number | null> {
  if (!provider || !ownerId || !Number.isSafeInteger(nowMs) ||
      !Number.isInteger(maxConcurrency) || maxConcurrency < 1 || maxConcurrency > 3) {
    throw new Error('Límite de concurrencia inválido.')
  }
  for (let slot = 0; slot < maxConcurrency; slot += 1) {
    const row = await db.prepare(`INSERT INTO provider_slots(provider,slot,owner_id,expires_at)
      VALUES(?,?,?,?) ON CONFLICT(provider,slot) DO UPDATE SET
      owner_id=excluded.owner_id, expires_at=excluded.expires_at
      WHERE provider_slots.expires_at <= ? RETURNING slot`)
      .bind(provider, slot, ownerId, nowMs + 30_000, nowMs).first<{ slot: number }>()
    if (row) return row.slot
  }
  return null
}

export async function releaseProviderSlot(db: D1Database, provider: string, slot: number,
  ownerId: string): Promise<void> {
  await db.prepare('DELETE FROM provider_slots WHERE provider=? AND slot=? AND owner_id=?')
    .bind(provider, slot, ownerId).run()
}
