import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { executeProvider } from '../../worker/providers/execute.js'
import { allocateBudget, reserveProviderCall } from '../../worker/providers/budget.js'
import { acquireProviderSlot, releaseProviderSlot } from '../../worker/providers/concurrency.js'
import type { TransportResult } from '../../worker/providers/transport.js'

const db = (env as Env).DB
if (!db) throw new Error('La prueba requiere D1 local.')

function setup(cap = 10) {
  const provider = `p${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`
  return { db, provider, capability: 'quote', requestId: crypto.randomUUID(),
    budget: { provider, scope: 'staging' as const,
      windows: [{ seconds: 60, cap }, { seconds: 86400, cap }], nowMs: 100_000 },
    pause: async () => {}, trace: vi.fn(),
  }
}

describe('orquestación local de un proveedor sintético', () => {
  it('una petición cancelada no realiza llamadas ni gasta cuota', async () => {
    const input = setup()
    const controller = new AbortController()
    controller.abort()
    const request = vi.fn(async () => ({ ok: true as const, data: 'synthetic', bytes: 1 }))
    expect(await executeProvider({ ...input, request, signal: controller.signal }))
      .toMatchObject({ ok: false, code: 'ABORTED', attempts: 0 })
    expect(request).not.toHaveBeenCalled()
  })
  it('la cancelación de un intento ya iniciado conserva su cuota y libera la plaza sin abrir circuito', async () => {
    const input = setup()
    const controller = new AbortController()
    const request = vi.fn(async () => {
      controller.abort()
      return { ok: false as const, code: 'ABORTED' as const, retryAfterMs: null }
    })
    expect(await executeProvider({ ...input, request, signal: controller.signal }))
      .toMatchObject({ ok: false, code: 'ABORTED', attempts: 1 })
    expect(request).toHaveBeenCalledTimes(1)
    expect((await db.prepare('SELECT SUM(used) AS used FROM provider_budgets WHERE provider=?')
      .bind(input.provider).first<{ used: number }>())?.used).toBe(2)
    expect((await db.prepare('SELECT COUNT(*) AS n FROM provider_status WHERE provider=?')
      .bind(input.provider).first<{ n: number }>())?.n).toBe(0)
    expect(await acquireProviderSlot(db, input.provider, 'next', 100_000, 1)).toBe(0)
  })
  it('reparte la cuota de una cuenta entre producción, staging y pruebas manuales', async () => {
    const provider = `p${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`
    const total = 20
    const allocation = allocateBudget(total)
    const scopes = ['production', 'staging', 'manual'] as const
    let used = 0
    for (const scope of scopes) {
      const cap = allocation[scope]
      const request = { provider, scope, windows: [{ seconds: 60, cap }], nowMs: 100_000 }
      for (let attempt = 0; attempt < cap; attempt += 1) {
        expect(await reserveProviderCall(db, request)).toEqual({ allowed: true })
        used += 1
      }
      expect(await reserveProviderCall(db, request)).toEqual({
        allowed: false, reason: 'RATE_LIMITED',
      })
    }
    expect(used + allocation.reserve).toBe(total)
    const rows = await db.prepare('SELECT scope, used FROM provider_budgets WHERE provider=?')
      .bind(provider).all<{ scope: string; used: number }>()
    expect(Object.fromEntries(rows.results.map((row) => [row.scope, row.used])))
      .toEqual({ production: allocation.production, staging: allocation.staging,
        manual: allocation.manual })
  })

  it('cuenta también el reintento y registra solo metadatos seguros', async () => {
    const input = setup()
    const request = vi.fn<() => Promise<TransportResult<{ value: string }>>>()
      .mockResolvedValueOnce({ ok: false, code: 'UPSTREAM_ERROR', retryAfterMs: null })
      .mockResolvedValueOnce({ ok: true, data: { value: '12.34' }, bytes: 18 })
    const result = await executeProvider({ ...input, request })
    expect(result).toEqual({ ok: true, data: { value: '12.34' }, attempts: 2 })
    expect(request).toHaveBeenCalledTimes(2)
    const rows = await db.prepare('SELECT used FROM provider_budgets WHERE provider=?')
      .bind(input.provider).all<{ used: number }>()
    expect(rows.results.map((row) => row.used)).toEqual([2, 2])
    expect(input.trace).toHaveBeenCalledWith(expect.objectContaining({
      provider: input.provider, status: 'OK', attempts: 2,
    }))
    expect(JSON.stringify(input.trace.mock.calls)).not.toContain('12.34')
  })

  it('respeta 429 y no vuelve a consultar mientras el circuito esté abierto', async () => {
    const input = setup()
    const request = vi.fn(async () => ({ ok: false as const, code: 'RATE_LIMITED' as const,
      retryAfterMs: 30_000 }))
    expect(await executeProvider({ ...input, request })).toMatchObject({
      ok: false, code: 'RATE_LIMITED', attempts: 1,
    })
    expect(await executeProvider({ ...input, request })).toMatchObject({
      ok: false, code: 'CIRCUIT_OPEN', attempts: 0,
    })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('no reintenta 403 y se cierra al faltar D1 o agotarse la cuota', async () => {
    const denied = setup()
    const request = vi.fn(async () => ({ ok: false as const, code: 'PLAN_DENIED' as const,
      retryAfterMs: null }))
    expect(await executeProvider({ ...denied, request })).toMatchObject({
      ok: false, code: 'PLAN_DENIED', attempts: 1,
    })
    expect(request).toHaveBeenCalledTimes(1)
    const unavailable = setup()
    expect(await executeProvider({ ...unavailable, db: undefined, request })).toMatchObject({
      ok: false, code: 'STORAGE_UNAVAILABLE', attempts: 0,
    })
    const tiny = setup(1)
    const down = vi.fn(async () => ({ ok: false as const, code: 'UPSTREAM_ERROR' as const,
      retryAfterMs: null }))
    expect(await executeProvider({ ...tiny, request: down })).toMatchObject({
      ok: false, code: 'RATE_LIMITED', attempts: 1,
    })
    expect(down).toHaveBeenCalledTimes(1)
  })

  it('limita tres llamadas simultáneas entre instancias y recupera plazas vencidas', async () => {
    const input = setup()
    const owners = ['one', 'two', 'three', 'four']
    const slots = await Promise.all(owners.map((owner) =>
      acquireProviderSlot(db, input.provider, owner, 1000)))
    expect(slots.filter((slot) => slot !== null)).toHaveLength(3)
    expect(slots.filter((slot) => slot === null)).toHaveLength(1)
    const firstOwner = owners[slots.findIndex((slot) => slot === 0)]
    await releaseProviderSlot(db, input.provider, 0, 'other')
    expect(await acquireProviderSlot(db, input.provider, 'five', 2000)).toBeNull()
    await releaseProviderSlot(db, input.provider, 0, firstOwner)
    expect(await acquireProviderSlot(db, input.provider, 'five', 2000)).toBe(0)
    expect(await acquireProviderSlot(db, input.provider, 'six', 32_001)).toBe(0)
  })

  it('no gasta cuota si la plaza de concurrencia está ocupada', async () => {
    const input = setup()
    expect(await acquireProviderSlot(db, input.provider, 'other', 100_000, 1)).toBe(0)
    const request = vi.fn(async () => ({ ok: true as const,
      data: { value: 'synthetic' }, bytes: 1 }))
    expect(await executeProvider({ ...input, maxConcurrency: 1, request }))
      .toMatchObject({ ok: false, code: 'CONCURRENCY_LIMITED', attempts: 0 })
    expect(request).not.toHaveBeenCalled()
    const row = await db.prepare('SELECT COUNT(*) AS n FROM provider_budgets WHERE provider=?')
      .bind(input.provider).first<{ n: number }>()
    expect(row?.n).toBe(0)
  })

  it('mantiene la caída de una fuente como error y abre circuito tras fallos repetidos', async () => {
    const input = setup()
    const request = vi.fn(async () => ({ ok: false as const, code: 'UPSTREAM_ERROR' as const,
      retryAfterMs: null }))
    expect(await executeProvider({ ...input, request })).toMatchObject({
      ok: false, code: 'UPSTREAM_ERROR', attempts: 2,
    })
    expect(await executeProvider({ ...input, request })).toMatchObject({
      ok: false, code: 'CIRCUIT_OPEN', attempts: 1,
    })
    expect(request).toHaveBeenCalledTimes(3)
  })
})
