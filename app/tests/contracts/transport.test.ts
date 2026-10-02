import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { requestJson } from '../../worker/providers/transport.js'

const schema = z.object({ price: z.string().min(1) })
const options = { baseUrl: 'https://example.org', path: '/quote',
  allowedOrigins: ['https://example.org'], schema }

describe('transporte de proveedores sin llamadas reales', () => {
  it('consulta solo origen aprobado y valida JSON', async () => {
    const fetcher = vi.fn(async () => Response.json({ price: '12.34' })) as typeof fetch
    expect(await requestJson({ ...options, fetcher })).toEqual({
      ok: true, data: { price: '12.34' }, bytes: 17,
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(await requestJson({ ...options, path: '//attacker.example/quote', fetcher }))
      .toMatchObject({ ok: false, code: 'HOST_NOT_APPROVED' })
    expect(await requestJson({ ...options, allowedOrigins: [], fetcher }))
      .toMatchObject({ ok: false, code: 'HOST_NOT_APPROVED' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('distingue 403 de plan, 429 y Retry-After sin exponer respuesta', async () => {
    const denied = await requestJson({ ...options, fetcher: async () =>
      new Response('private error', { status: 403 }) })
    expect(denied).toEqual({ ok: false, code: 'PLAN_DENIED', retryAfterMs: null })
    const limited = await requestJson({ ...options, nowMs: 1000, fetcher: async () =>
      new Response('secret text', { status: 429, headers: { 'Retry-After': '3' } }) })
    expect(limited).toEqual({ ok: false, code: 'RATE_LIMITED', retryAfterMs: 3000 })
    expect(JSON.stringify(limited)).not.toContain('secret text')
  })

  it('rechaza cuerpo grande, JSON inválido y esquema inesperado', async () => {
    expect(await requestJson({ ...options, maxBytes: 5, fetcher: async () =>
      Response.json({ price: '12.34' }) })).toMatchObject({ code: 'RESPONSE_TOO_LARGE' })
    expect(await requestJson({ ...options, fetcher: async () =>
      new Response('{bad', { headers: { 'Content-Type': 'application/json' } }) }))
      .toMatchObject({ code: 'INVALID_RESPONSE' })
    expect(await requestJson({ ...options, fetcher: async () => Response.json({ price: null }) }))
      .toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('detiene una respuesta que excede el plazo', async () => {
    const fetcher: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError')))
    })
    expect(await requestJson({ ...options, timeoutMs: 5, fetcher }))
      .toMatchObject({ ok: false, code: 'TIMEOUT' })
  })
})
