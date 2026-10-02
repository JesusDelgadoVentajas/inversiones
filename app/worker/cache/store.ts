import type { z } from 'zod'
import { provenanceSchema } from '../../shared/contracts/blocks.js'
import type { Provenance } from '../../shared/contracts/blocks.js'

export interface CacheKeyParts {
  provider: string
  capability: string
  entityId: string
  currency: string | null
  feed: string | null
  resolution: string | null
  adjustment: string | null
  periodStart: string | null
  periodEnd: string | null
  methodologyVersion: string
}

export async function cacheKey(parts: CacheKeyParts): Promise<string> {
  if (!parts.provider || !parts.capability || !parts.entityId || !parts.methodologyVersion) {
    throw new Error('Clave de caché incompleta.')
  }
  const bytes = new TextEncoder().encode(JSON.stringify([
    parts.provider, parts.capability, parts.entityId, parts.currency, parts.feed,
    parts.resolution, parts.adjustment, parts.periodStart, parts.periodEnd,
    parts.methodologyVersion,
  ]))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return 'v1:' + Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export interface Cached<T> {
  data: T
  provenance: Provenance[]
  checkedAt: number
  ageSeconds: number
  fresh: boolean
}

export async function readCache<T extends z.ZodType>(db: D1Database, key: string, schema: T,
  nowMs: number): Promise<Cached<z.infer<T>> | null> {
  const row = await db.prepare(`SELECT body_json, provenance_json, checked_at, expires_at,
    created_at, last_accessed_at
    FROM cache_entries WHERE cache_key=?`).bind(key).first<{
    body_json: string; provenance_json: string; checked_at: number;
    expires_at: number; created_at: number; last_accessed_at: number
  }>()
  if (!row) return null
  try {
    const data = schema.parse(JSON.parse(row.body_json))
    const provenance = provenanceSchema.array().parse(JSON.parse(row.provenance_json))
    if (nowMs - row.last_accessed_at >= 3_600_000) {
      try {
        await db.prepare(`UPDATE cache_entries SET last_accessed_at=?
          WHERE cache_key=? AND last_accessed_at<=?`)
          .bind(nowMs, key, nowMs - 3_600_000).run()
      } catch { /* La falta de presupuesto para este toque no invalida un dato ya leído. */ }
    }
    // La lectura no actualiza checkedAt ni las fechas originales de procedencia.
    return { data, provenance, checkedAt: row.checked_at,
      ageSeconds: Math.max(0, Math.floor((nowMs - row.created_at) / 1000)),
      fresh: row.expires_at > nowMs }
  } catch {
    return null
  }
}

export async function writeCache<T extends z.ZodType>(db: D1Database, key: string,
  data: unknown, schema: T, provenance: Provenance[], options: {
    retentionAllowed: boolean; nowMs: number; checkedAt: number; ttlSeconds: number;
    methodologyVersion: string; provider: string; capability: string
  }): Promise<boolean> {
  if (!options.retentionAllowed) return false
  if (!Number.isSafeInteger(options.nowMs) || !Number.isSafeInteger(options.checkedAt) ||
      !Number.isInteger(options.ttlSeconds) || options.ttlSeconds < 1 ||
      options.ttlSeconds > 7 * 86400 || !options.provider || !options.capability) {
    throw new Error('Política de caché inválida.')
  }
  const bodyJson = JSON.stringify(schema.parse(data))
  const provenanceJson = JSON.stringify(provenanceSchema.array().min(1).parse(provenance))
  if (new TextEncoder().encode(bodyJson).length > 131072) throw new Error('Dato demasiado grande para caché.')
  await db.prepare(`INSERT INTO cache_entries
    (cache_key,body_json,provenance_json,methodology_version,checked_at,expires_at,created_at,last_accessed_at,provider,capability)
    VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(cache_key) DO UPDATE SET
    body_json=excluded.body_json, provenance_json=excluded.provenance_json,
    methodology_version=excluded.methodology_version, checked_at=excluded.checked_at,
    expires_at=excluded.expires_at, created_at=excluded.created_at,
    last_accessed_at=excluded.last_accessed_at,provider=excluded.provider,
    capability=excluded.capability`)
    .bind(key, bodyJson, provenanceJson, options.methodologyVersion, options.checkedAt,
      options.nowMs + options.ttlSeconds * 1000, options.nowMs, options.nowMs,
      options.provider, options.capability).run()
  return true
}

export async function purgeExpired(db: D1Database, nowMs: number, limit = 100): Promise<number> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Límite de limpieza inválido.')
  const result = await db.prepare(`DELETE FROM cache_entries WHERE cache_key IN
    (SELECT cache_key FROM cache_entries WHERE expires_at <= ? ORDER BY expires_at LIMIT ?)`)
    .bind(nowMs, limit).run()
  return result.meta.changes ?? 0
}

export async function purgeProviderCache(db: D1Database, provider: string,
  limit = 100): Promise<number> {
  if (!provider || !Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error('Limpieza de proveedor inválida.')
  }
  const result = await db.prepare(`DELETE FROM cache_entries WHERE cache_key IN
    (SELECT cache_key FROM cache_entries WHERE provider=? LIMIT ?)`)
    .bind(provider, limit).run()
  return result.meta.changes ?? 0
}

export async function purgeToBudget(db: D1Database, maxPayloadBytes = 80_000_000,
  limit = 100): Promise<{ deleted: number; remainingPayloadBytes: number }> {
  if (!Number.isSafeInteger(maxPayloadBytes) || maxPayloadBytes < 1 ||
      !Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error('Presupuesto de almacenamiento inválido.')
  }
  const sizeSql = 'length(CAST(body_json AS BLOB))+length(CAST(provenance_json AS BLOB))'
  const total = await db.prepare(`SELECT COALESCE(SUM(${sizeSql}),0) AS bytes FROM cache_entries`)
    .first<{ bytes: number }>()
  let remaining = total?.bytes ?? 0
  if (remaining <= maxPayloadBytes) return { deleted: 0, remainingPayloadBytes: remaining }
  const rows = await db.prepare(`SELECT cache_key, ${sizeSql} AS bytes FROM cache_entries
    ORDER BY last_accessed_at, created_at LIMIT ?`).bind(limit)
    .all<{ cache_key: string; bytes: number }>()
  const keys: string[] = []
  for (const row of rows.results) {
    keys.push(row.cache_key)
    remaining -= row.bytes
    if (remaining <= maxPayloadBytes) break
  }
  if (keys.length > 0) {
    await db.prepare(`DELETE FROM cache_entries WHERE cache_key IN (${keys.map(() => '?').join(',')})`)
      .bind(...keys).run()
  }
  return { deleted: keys.length, remainingPayloadBytes: remaining }
}
