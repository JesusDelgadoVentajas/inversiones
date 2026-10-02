import type { z } from 'zod'
import type { Provenance } from '../../shared/contracts/blocks.js'
import { acquireLease, releaseLease } from '../cache/lease.js'
import { readCache, writeCache } from '../cache/store.js'
import { cacheTtl } from '../cache/policy.js'
import type { CacheBlock } from '../cache/policy.js'

type Loaded<T> = { status: 'fresh' | 'cached' | 'stale'; data: T; provenance: Provenance[];
  checkedAt: number; cacheAgeSeconds: number | null; reasonCode: string | null } |
  { status: 'pending' | 'error'; data: null; provenance: []; checkedAt: null;
    cacheAgeSeconds: null; reasonCode: string }

type Refreshed<T> = { ok: true; data: T; provenance: Provenance[]; checkedAt: number } |
  { ok: false; code: string }

export function createCachedLoader<T extends z.ZodType>(db: D1Database | undefined, schema: T) {
  const inFlight = new Map<string, Promise<Loaded<z.infer<T>>>>()

  async function load(options: {
    key: string; nowMs: number; provider: string; capability: CacheBlock; methodologyVersion: string;
    permittedRetentionSeconds: number | null; refresh: () => Promise<Refreshed<z.infer<T>>>
  }): Promise<Loaded<z.infer<T>>> {
    const existing = inFlight.get(options.key)
    if (existing) return existing
    const task = run(options)
    inFlight.set(options.key, task)
    try { return await task }
    finally { inFlight.delete(options.key) }
  }

  async function run(options: Parameters<typeof load>[0]): Promise<Loaded<z.infer<T>>> {
    if (!db) return { status: 'error', data: null, provenance: [], checkedAt: null,
      cacheAgeSeconds: null, reasonCode: 'STORAGE_UNAVAILABLE' }
    try {
      const ttlSeconds = cacheTtl(options.capability, options.permittedRetentionSeconds)
      const cached = ttlSeconds > 0 ? await readCache(db, options.key, schema, options.nowMs) : null
      if (cached?.fresh) return { status: 'cached', data: cached.data,
        provenance: cached.provenance, checkedAt: cached.checkedAt,
        cacheAgeSeconds: cached.ageSeconds, reasonCode: null }
      const owner = crypto.randomUUID()
      if (!await acquireLease(db, options.key, owner, options.nowMs)) {
        return cached ? { status: 'stale', data: cached.data, provenance: cached.provenance,
          checkedAt: cached.checkedAt, cacheAgeSeconds: cached.ageSeconds,
          reasonCode: 'REFRESH_IN_PROGRESS' } : {
          status: 'pending', data: null, provenance: [], checkedAt: null,
          cacheAgeSeconds: null, reasonCode: 'REFRESH_IN_PROGRESS',
        }
      }
      try {
        let refreshed: Refreshed<z.infer<T>>
        try { refreshed = await options.refresh() }
        catch { refreshed = { ok: false, code: 'UPSTREAM_ERROR' } }
        if (!refreshed.ok) {
          return cached ? { status: 'stale', data: cached.data, provenance: cached.provenance,
            checkedAt: cached.checkedAt, cacheAgeSeconds: cached.ageSeconds,
            reasonCode: refreshed.code } : {
            status: 'error', data: null, provenance: [], checkedAt: null,
            cacheAgeSeconds: null, reasonCode: refreshed.code,
          }
        }
        const data = schema.parse(refreshed.data)
        await writeCache(db, options.key, data, schema, refreshed.provenance, {
          retentionAllowed: ttlSeconds > 0, nowMs: options.nowMs,
          checkedAt: refreshed.checkedAt, ttlSeconds,
          methodologyVersion: options.methodologyVersion,
          provider: options.provider, capability: options.capability,
        })
        return { status: 'fresh', data, provenance: refreshed.provenance,
          checkedAt: refreshed.checkedAt, cacheAgeSeconds: null, reasonCode: null }
      } finally {
        await releaseLease(db, options.key, owner)
      }
    } catch {
      return { status: 'error', data: null, provenance: [], checkedAt: null,
        cacheAgeSeconds: null, reasonCode: 'STORAGE_OR_VALIDATION_ERROR' }
    }
  }
  return { load }
}
