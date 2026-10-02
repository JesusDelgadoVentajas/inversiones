import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { quoteSchema } from '../../shared/contracts/financial.js'
import { cacheKey } from '../../worker/cache/store.js'
import { createCachedLoader } from '../../worker/services/load-block.js'
import { provenance, quote } from '../fixtures/contracts.js'

const db = (env as Env).DB
if (!db) throw new Error('La prueba requiere D1 local.')

async function key() {
  return cacheKey({ provider: 'synthetic', capability: 'quote', entityId: crypto.randomUUID(),
    currency: 'GBP', feed: 'test', resolution: null, adjustment: null,
    periodStart: null, periodEnd: null, methodologyVersion: 'v1' })
}

describe('servicio local de bloque', () => {
  it('agrupa consultas idénticas y mantiene la fecha original al servir caché o stale', async () => {
    const loader = createCachedLoader(db, quoteSchema)
    const cacheKey = await key()
    const refresh = vi.fn(async () => ({ ok: true as const, data: quote,
      provenance: [provenance], checkedAt: 1000 }))
    const options = { key: cacheKey, nowMs: 1000, provider: 'synthetic', capability: 'quote' as const,
      methodologyVersion: 'v1', permittedRetentionSeconds: 60, refresh }
    const [first, second] = await Promise.all([loader.load(options), loader.load(options)])
    expect(first).toMatchObject({ status: 'fresh', checkedAt: 1000 })
    expect(second).toEqual(first)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(await loader.load({ ...options, nowMs: 2000 })).toMatchObject({
      status: 'cached', checkedAt: 1000, cacheAgeSeconds: 1,
    })
    expect(await loader.load({ ...options, nowMs: 70_000,
      refresh: async () => ({ ok: false as const, code: 'UPSTREAM_ERROR' }) }))
      .toMatchObject({ status: 'stale', checkedAt: 1000, reasonCode: 'UPSTREAM_ERROR' })
  })

  it('evita dos refrescos entre instancias locales mediante lease D1', async () => {
    const cacheKey = await key()
    const first = createCachedLoader(db, quoteSchema)
    const second = createCachedLoader(db, quoteSchema)
    let release: () => void = () => {}
    let started: () => void = () => {}
    const gate = new Promise<void>((resolve) => { release = resolve })
    const began = new Promise<void>((resolve) => { started = resolve })
    const options = { key: cacheKey, nowMs: 1000, provider: 'synthetic', capability: 'quote' as const,
      methodologyVersion: 'v1', permittedRetentionSeconds: null }
    const loading = first.load({ ...options, refresh: async () => {
      started()
      await gate
      return { ok: true as const, data: quote, provenance: [provenance], checkedAt: 1000 }
    } })
    await began
    const unused = vi.fn(async () => ({ ok: true as const, data: quote,
      provenance: [provenance], checkedAt: 1000 }))
    expect(await second.load({ ...options, refresh: unused })).toMatchObject({
      status: 'pending', reasonCode: 'REFRESH_IN_PROGRESS',
    })
    expect(unused).not.toHaveBeenCalled()
    release()
    expect(await loading).toMatchObject({ status: 'fresh' })
  })
})
