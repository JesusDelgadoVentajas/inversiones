import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { createDataApi } from '../../worker/routes/data.js'
import { readProfile, saveIdentity } from '../../worker/identity/store.js'
import { emptyBlock, loadProviderBlock } from '../../worker/services/provider-block.js'
import { quoteSchema } from '../../shared/contracts/financial.js'
import type { Quote } from '../../shared/contracts/financial.js'
import type { DataBlock } from '../../shared/contracts/blocks.js'
import type { ProviderAdapter } from '../../worker/providers/types.js'
import { candidate, history } from '../fixtures/market.js'
import { quote, quoteBlock, requestId } from '../fixtures/contracts.js'

const db = (env as Env).DB
if (!db) throw new Error('Falta D1 local de pruebas.')
const dataDb = db
const block = <T>(data: T): DataBlock<T> => ({ ...quoteBlock, status: 'available', data })

describe('búsqueda y ficha en D1 local con proveedor sintético', () => {
  it('consulta un nombre nuevo, guarda identidad y abre perfil sin caché financiera', async () => {
    const name = `Emisor nuevo ${crypto.randomUUID()}`
    const search = vi.fn(async () => block([candidate(name)]))
    const adapter: ProviderAdapter = { id: 'synthetic-provider', capabilities: new Set(['search', 'quote', 'history']),
      search, quote: async () => block(quote), history: async () => block(history) }
    const api = createDataApi(dataDb, [{ adapter, identityRetentionAllowed: true }])
    const response = await api(new Request(`https://local.test/api/v1/search?q=${encodeURIComponent(name)}`), requestId)
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    const body = await response.json() as { data: { company: { legalName: string }; mappings?: unknown }[] }
    expect(body.data[0].company.legalName).toBe(name)
    expect(body.data[0].mappings).toBeUndefined()
    expect(search).toHaveBeenCalledWith(name, expect.objectContaining({ requestId }))
    const id = candidate().listings[0].id
    const profile = await api(new Request(`https://local.test/api/v1/listings/${id}/profile`), requestId)
    expect(await profile.json()).toMatchObject({ company: { legalName: name }, listing: { currency: 'GBP' } })
    expect(await (await api(new Request(`https://local.test/api/v1/listings/${id}/quote`), requestId)).json())
      .toMatchObject({ data: { price: '12.34', observedAt: quote.observedAt } })
    expect(await (await api(new Request(`https://local.test/api/v1/listings/${id}/prices?range=1y`), requestId)).json())
      .toMatchObject({ data: { bars: [{ close: '10' }, { close: '12.34' }] } })
  })
  it('reutiliza identidad y mantiene otra clase/bolsa separada; impide reasignar un mapeo', async () => {
    const original = candidate()
    await saveIdentity(dataDb, original, 'synthetic-provider')
    await saveIdentity(dataDb, { ...original, company: { ...original.company, legalName: 'Nombre actualizado' } }, 'synthetic-provider')
    expect((await readProfile(dataDb, original.listings[0].id))?.company.legalName).toBe('Nombre actualizado')
    const id = crypto.randomUUID()
    const second = { ...original, listings: [{ ...original.listings[0], id, mic: 'XNAS', currency: 'USD', instrument: 'adr' as const }],
      mappings: [original.mappings[0], { ...original.mappings[1], id: crypto.randomUUID(), listingId: id, externalId: 'listing-adr' }] }
    await saveIdentity(dataDb, second, 'synthetic-provider')
    expect((await readProfile(dataDb, id))?.listing).toMatchObject({ mic: 'XNAS', currency: 'USD', instrument: 'adr' })
    await expect(saveIdentity(dataDb, { ...original, listings: [{ ...original.listings[0], currency: 'USD' }] }, 'synthetic-provider'))
      .rejects.toThrow('IDENTITY_CONFLICT')
  })
  it('falla sin fuente aprobada y rechaza parámetros libres o identidad desconocida', async () => {
    const api = createDataApi(dataDb, [])
    expect(await (await api(new Request('https://local.test/api/v1/search?q=Empresa'), requestId)).json())
      .toMatchObject({ status: 'unavailable', data: null, reasonCode: 'NO_APPROVED_PROVIDER' })
    for (const path of ['/api/v1/search?q=A', '/api/v1/search?q=Apple&q=Other',
      '/api/v1/search?q=Apple&url=https://example.org', '/api/v1/listings/invalid/quote']) {
      expect((await api(new Request(`https://local.test${path}`), requestId)).status).toBe(400)
    }
    expect((await api(new Request(`https://local.test/api/v1/listings/${crypto.randomUUID()}/profile`), requestId)).status).toBe(404)
  })
  it('una colisión SQL revierte el lote y no cambia el emisor guardado', async () => {
    const original = candidate()
    await saveIdentity(dataDb, original, 'synthetic-provider')
    await expect(dataDb.batch([
      dataDb.prepare('UPDATE companies SET legal_name=? WHERE id=?').bind('Nombre incorrecto', original.company.id),
      dataDb.prepare('UPDATE listings SET currency=? WHERE id=?').bind('USD', original.listings[0].id),
    ])).rejects.toThrow()
    expect((await readProfile(dataDb, original.listings[0].id))?.company.legalName).toBe(original.company.legalName)
  })
  it('no anuncia búsqueda sin permiso de retención ni métodos ausentes', async () => {
    const search = vi.fn(async () => block([candidate()]))
    const adapter: ProviderAdapter = { id: 'synthetic-provider', capabilities: new Set(['search', 'quote', 'history']), search }
    const api = createDataApi(dataDb, [{ adapter, identityRetentionAllowed: false }])
    expect(await (await api(new Request('https://local.test/api/v1/capabilities'), requestId)).json())
      .toEqual({ search: false, quote: false, history: false })
    await api(new Request('https://local.test/api/v1/search?q=Empresa'), requestId)
    expect(search).not.toHaveBeenCalled()
  })
  it('excluye fondos y no recibe identidades aportadas por el cliente', async () => {
    const result = candidate()
    result.listings[0].instrument = 'fund'
    const adapter: ProviderAdapter = { id: 'synthetic-provider', capabilities: new Set(['search']),
      search: async () => block([result]) }
    const api = createDataApi(dataDb, [{ adapter, identityRetentionAllowed: true }])
    expect(await (await api(new Request('https://local.test/api/v1/search?q=Empresa'), requestId)).json())
      .toMatchObject({ status: 'unavailable', data: null, reasonCode: 'EXCLUDED_INSTRUMENT' })
    const response = await api(new Request('https://local.test/api/v1/search?q=Empresa', { method: 'POST' }), requestId)
    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('GET')
  })
})

describe('alternativas y cancelación de bloques', () => {
  it('usa una alternativa validada como máximo y nunca convierte ausencia en cero', async () => {
    const first = vi.fn(async () => emptyBlock<Quote>(requestId))
    const second = vi.fn(async () => quoteBlock)
    const third = vi.fn(async () => quoteBlock)
    const result = await loadProviderBlock(quoteSchema, [first, second, third], {
      requestId, signal: new AbortController().signal,
    })
    expect(result.data?.price).toBe('12.34')
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(third).not.toHaveBeenCalled()
  })
  it('descarta un trabajo cancelado aunque el adaptador no complete su promesa', async () => {
    const controller = new AbortController()
    const call = vi.fn(() => { controller.abort(); return new Promise<never>(() => {}) })
    const result = await loadProviderBlock(quoteSchema, [call], { requestId, signal: controller.signal })
    expect(result).toMatchObject({ status: 'error', data: null, reasonCode: 'ABORTED' })
    expect(call).toHaveBeenCalledTimes(1)
  })
})
