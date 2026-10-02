import { env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { createDataApi } from '../../worker/routes/data.js'
import { saveIdentity } from '../../worker/identity/store.js'
import type { ProviderAdapter } from '../../worker/providers/types.js'
import { candidate } from '../fixtures/market.js'
import { financials, news } from '../fixtures/research.js'
import { quoteBlock, requestId } from '../fixtures/contracts.js'
import { newsPageSchema } from '../../shared/contracts/context.js'
import { normalizeSecFilings } from '../../worker/normalization/sec-news.js'

const db = (env as Env).DB
if (!db) throw new Error('Falta D1 local de pruebas.')
const dataDb = db
const request = (path: string) => new Request('https://local.test/api/v1/' + path)
const block = <T>(data: T) => ({ ...quoteBlock, data })
describe('cuentas, métricas y noticias en Workerd/D1 local', () => {
  it('normaliza un registro SEC sintético con UUID estable y fecha de presentación en Workerd', async () => {
    const identity = candidate()
    identity.company.identifiers = { cik: '0000000123' }
    await saveIdentity(dataDb, identity, 'synthetic-provider')
    const raw = { cik: '123', filings: { recent: { accessionNumber: ['0000000123-26-000001'],
      filingDate: ['2026-09-20'], form: ['10-Q'], primaryDocument: ['synthetic.htm'] } } }
    const adapter: ProviderAdapter = { id: 'synthetic-provider', capabilities: new Set(['news']),
      news: async (company) => block(await normalizeSecFilings(raw, company)) }
    const api = createDataApi(dataDb, [{ adapter, identityRetentionAllowed: true }])
    const path = 'companies/' + identity.company.id + '/news'
    const first = await (await api(request(path), requestId)).json() as { data: unknown }
    const second = await (await api(request(path), requestId)).json() as { data: unknown }
    const item = newsPageSchema.parse(first.data).items[0]
    expect(item.id).toBe(newsPageSchema.parse(second.data).items[0].id)
    expect(item).toMatchObject({ kind: 'regulatory', dateKind: 'filing', publishedAt: null, publishedDate: '2026-09-20' })
  })
  it('sirve cuentas por emisor y métricas por listing sin inventar datos de mercado', async () => {
    const identity = candidate()
    await saveIdentity(dataDb, identity, 'synthetic-provider')
    const adapter: ProviderAdapter = { id: 'synthetic-provider', capabilities: new Set(['financials']),
      financials: async () => block(financials) }
    const api = createDataApi(dataDb, [{ adapter, identityRetentionAllowed: true }])
    const facts = await api(request('companies/' + identity.company.id + '/financials'), requestId)
    expect(facts.headers.get('cache-control')).toBe('private, no-store')
    const body = await facts.json() as { data: unknown[] }
    expect(body.data).toHaveLength(financials.length)
    expect(body.data[0]).toMatchObject({ concept: 'revenue', value: '400' })
    const result = await (await api(request('listings/' + identity.listings[0].id + '/metrics'), requestId)).json() as {
      status: string; data: { id: string; value: string | null }[]
    }
    expect(result.status).toBe('partial')
    expect(result.data).toHaveLength(32)
    expect(result.data.find((metric) => metric.id === 'M12')?.value).toBe('40')
    expect(result.data.find((metric) => metric.id === 'M23')?.value).toBeNull()
  })
  it('rechaza cuentas de otro emisor antes de usar una alternativa válida', async () => {
    const identity = candidate()
    await saveIdentity(dataDb, identity, 'synthetic-provider')
    const first: ProviderAdapter = { id: 'wrong', capabilities: new Set(['financials']),
      financials: async () => block(financials.map((fact) => ({ ...fact, companyId: crypto.randomUUID() }))) }
    const second = { ...first, id: 'synthetic-provider', financials: vi.fn(async () => block(financials)) }
    const api = createDataApi(dataDb, [first, second].map((adapter) => ({ adapter, identityRetentionAllowed: true })))
    const body = await (await api(request('companies/' + identity.company.id + '/financials'), requestId)).json() as {
      status: string; data: { companyId: string }[]
    }
    expect(body.status).toBe('available')
    expect(body.data.every((fact) => fact.companyId === identity.company.id)).toBe(true)
    expect(second.financials).toHaveBeenCalledOnce()
  })
  it('pagina noticias y no transmite el cursor de la app al proveedor', async () => {
    const identity = candidate()
    await saveIdentity(dataDb, identity, 'synthetic-provider')
    const source = vi.fn<NonNullable<ProviderAdapter['news']>>(async () => block(Array.from({ length: 24 }, (_, index) => news(index))))
    const adapter: ProviderAdapter = { id: 'synthetic-provider', capabilities: new Set(['news']), news: source }
    const api = createDataApi(dataDb, [{ adapter, identityRetentionAllowed: true }])
    const path = 'companies/' + identity.company.id + '/news'
    const first = await (await api(request(path), requestId)).json() as { data: unknown }
    const page = newsPageSchema.parse(first.data)
    expect(page.items).toHaveLength(20)
    expect(await (await api(request(path + '?cursor=' + page.nextCursor), requestId)).json())
      .toMatchObject({ data: { items: expect.any(Array), nextCursor: null } })
    expect(source.mock.calls.every((args) => args[1] === null)).toBe(true)
    const count = source.mock.calls.length
    expect((await api(request(path + '?kind=macro&cursor=' + page.nextCursor), requestId)).status).toBe(400)
    expect(source).toHaveBeenCalledTimes(count)
  })
  it('valida rutas, filtros, IDs y ausencia de proveedor sin consultas arbitrarias', async () => {
    const identity = candidate()
    await saveIdentity(dataDb, identity, 'synthetic-provider')
    const api = createDataApi(dataDb, [])
    for (const path of ['companies/' + identity.company.id + '/financials?url=https://example.org',
      'companies/' + identity.company.id + '/news?kind=bad',
      'companies/' + identity.company.id + '/news?cursor=',
      'listings/invalid/metrics']) expect((await api(request(path), requestId)).status).toBe(400)
    expect((await api(request('companies/' + identity.company.id + '/metrics'), requestId)).status).toBe(404)
    expect(await (await api(request('listings/' + identity.listings[0].id + '/metrics'), requestId)).json())
      .toMatchObject({ status: 'unavailable', data: null, reasonCode: 'NO_APPROVED_PROVIDER' })
  })
})
