import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { quoteSchema } from '../../shared/contracts/financial.js'
import { acquireLease, releaseLease } from '../../worker/cache/lease.js'
import { cacheKey, purgeExpired, purgeProviderCache, purgeToBudget, readCache,
  writeCache } from '../../worker/cache/store.js'
import { allocateBudget, reserveProviderCall } from '../../worker/providers/budget.js'
import { provenance, quote } from '../fixtures/contracts.js'

const db = (env as Env).DB
if (!db) throw new Error('La prueba requiere D1 local.')

describe('D1 local: cuotas compartidas por ventana', () => {
  it('reserva en dos ventanas de forma atómica bajo concurrencia', async () => {
    const input = { provider: 'synthetic-concurrent', scope: 'staging' as const,
      windows: [{ seconds: 60, cap: 3 }, { seconds: 86400, cap: 4 }], nowMs: 120_000 }
    const results = await Promise.all(Array.from({ length: 8 }, () => reserveProviderCall(db, input)))
    expect(results.filter((result) => result.allowed)).toHaveLength(3)
    expect(results.filter((result) => !result.allowed && result.reason === 'RATE_LIMITED'))
      .toHaveLength(5)
    const rows = await db.prepare(`SELECT window_seconds,used FROM provider_budgets
      WHERE provider=? ORDER BY window_seconds`).bind(input.provider).all<{ window_seconds: number; used: number }>()
    expect(rows.results).toEqual([{ window_seconds: 60, used: 3 },
      { window_seconds: 86400, used: 3 }])
    expect(await reserveProviderCall(db, { ...input, nowMs: 180_000 })).toEqual({ allowed: true })
    expect(await reserveProviderCall(db, { ...input, nowMs: 180_000 })).toEqual({
      allowed: false, reason: 'RATE_LIMITED',
    })
  })

  it('cierra al faltar D1 y reserva una fracción de la cuota contractual', async () => {
    expect(await reserveProviderCall(undefined, { provider: 'synthetic', scope: 'manual',
      windows: [{ seconds: 60, cap: 1 }], nowMs: 0 })).toEqual({
      allowed: false, reason: 'STORAGE_UNAVAILABLE',
    })
    expect(allocateBudget(20)).toEqual({ production: 10, staging: 3, manual: 1, reserve: 6 })
    expect(allocateBudget(1)).toEqual({ production: 0, staging: 0, manual: 0, reserve: 1 })
  })
})

describe('D1 local: caché y agrupación', () => {
  it('usa todas las dimensiones, respeta licencia y conserva la observación antigua', async () => {
    const parts = { provider: 'synthetic', capability: 'quote', entityId: quote.listingId,
      currency: 'GBP', feed: 'feed-a', resolution: null, adjustment: null,
      periodStart: null, periodEnd: null, methodologyVersion: 'v1' }
    const key = await cacheKey(parts)
    expect(await cacheKey({ ...parts, feed: 'feed-b' })).not.toBe(key)
    expect(await cacheKey({ ...parts, currency: 'USD' })).not.toBe(key)
    const options = { retentionAllowed: false, nowMs: 100_000, checkedAt: 99_000,
      ttlSeconds: 60, methodologyVersion: 'v1', provider: 'synthetic', capability: 'quote' }
    expect(await writeCache(db, key, quote, quoteSchema, [provenance], options)).toBe(false)
    expect(await readCache(db, key, quoteSchema, 100_000)).toBeNull()
    expect(await writeCache(db, key, quote, quoteSchema, [provenance], {
      ...options, retentionAllowed: true })).toBe(true)
    const fresh = await readCache(db, key, quoteSchema, 110_000)
    expect(fresh).toMatchObject({ data: quote, checkedAt: 99_000, ageSeconds: 10, fresh: true })
    const old = await readCache(db, key, quoteSchema, 170_000)
    expect(old).toMatchObject({ checkedAt: 99_000, ageSeconds: 70, fresh: false })
    expect(old?.provenance[0].observedAt).toBe('2026-10-02T09:59:00Z')
    expect(await purgeExpired(db, 170_000, 1)).toBe(1)
    expect(await readCache(db, key, quoteSchema, 170_000)).toBeNull()
  })

  it('permite un solo propietario hasta caducar el bloqueo', async () => {
    const key = await cacheKey({ provider: 'synthetic', capability: 'quote',
      entityId: crypto.randomUUID(), currency: 'EUR', feed: null, resolution: null,
      adjustment: null, periodStart: null, periodEnd: null, methodologyVersion: 'v1' })
    expect(await acquireLease(db, key, 'owner-a', 1000)).toBe(true)
    expect(await acquireLease(db, key, 'owner-b', 2000)).toBe(false)
    expect(await acquireLease(db, key, 'owner-b', 11_000)).toBe(true)
    expect(await releaseLease(db, key, 'owner-a')).toBe(false)
    expect(await releaseLease(db, key, 'owner-b')).toBe(true)
  })

  it('limpia por lotes cuando el contenido supera el presupuesto interno', async () => {
    for (let index = 0; index < 3; index += 1) {
      const key = await cacheKey({ provider: 'synthetic', capability: 'quote',
        entityId: crypto.randomUUID(), currency: 'GBP', feed: 'test', resolution: null,
        adjustment: null, periodStart: null, periodEnd: null, methodologyVersion: 'v1' })
      await writeCache(db, key, quote, quoteSchema, [provenance], {
        retentionAllowed: true, nowMs: 1000 + index, checkedAt: 1000,
        ttlSeconds: 60, methodologyVersion: 'v1', provider: 'synthetic', capability: 'quote',
      })
    }
    const cleaned = await purgeToBudget(db, 1, 2)
    expect(cleaned.deleted).toBe(2)
    expect(cleaned.remainingPayloadBytes).toBeGreaterThan(0)
  })

  it('permite retirar por lotes datos de una fuente sin licencia', async () => {
    const provider = `synthetic-${crypto.randomUUID().slice(0, 8)}`
    const key = await cacheKey({ provider, capability: 'quote', entityId: quote.listingId,
      currency: 'GBP', feed: 'test', resolution: null, adjustment: null,
      periodStart: null, periodEnd: null, methodologyVersion: 'v1' })
    await writeCache(db, key, quote, quoteSchema, [provenance], {
      retentionAllowed: true, nowMs: 1000, checkedAt: 1000, ttlSeconds: 60,
      methodologyVersion: 'v1', provider, capability: 'quote',
    })
    expect(await purgeProviderCache(db, provider, 1)).toBe(1)
    expect(await readCache(db, key, quoteSchema, 2000)).toBeNull()
  })
})
