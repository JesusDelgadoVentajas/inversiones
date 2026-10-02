import { dataBlockSchema } from '../../shared/contracts/blocks.js'
import type { DataBlock } from '../../shared/contracts/blocks.js'
import { financialFactSchema, historySchema, metricSchema, quoteSchema } from '../../shared/contracts/financial.js'
import type { Company, Listing } from '../../shared/contracts/identity.js'
import { newsItemSchema, newsPageSchema } from '../../shared/contracts/context.js'
import { calculateMetrics } from '../../shared/finance/metrics.js'
import { newsPage } from '../../shared/news/page.js'
import type { RegisteredProvider } from '../providers/registry.js'
import type { ProviderContext } from '../providers/types.js'
import { emptyBlock, loadProviderBlock } from './provider-block.js'

const factsSchema = financialFactSchema.array().max(1000)

export function loadFinancials(company: Company, providers: readonly RegisteredProvider[], context: ProviderContext) {
  return loadProviderBlock(factsSchema, providers.filter(({ adapter }) =>
    adapter.capabilities.has('financials') && adapter.financials).map(({ adapter }) => async (ctx) => {
    const block = await adapter.financials!(company, ctx)
    const checked = dataBlockSchema(factsSchema).parse(block)
    if (checked.data?.some((fact) => fact.companyId !== company.id)) throw new Error('IDENTITY_INVALID')
    return checked
  }), context)
}

export async function loadNews(company: Company, providers: readonly RegisteredProvider[], context: ProviderContext,
  options: { kind: string; cursor: string | null; asOf: string }) {
  // El cursor de la app pagina una ventana acotada; no es un cursor de terceros.
  const block = await loadProviderBlock(newsItemSchema.array().max(200), providers.filter(({ adapter }) =>
    adapter.capabilities.has('news') && adapter.news).map(({ adapter }) =>
    (ctx) => adapter.news!(company, null, ctx)), context)
  if (block.data === null) return { ...block, data: null }
  return dataBlockSchema(newsPageSchema).parse({ ...block,
    data: newsPage(block.data, { ...options, companyId: company.id }) })
}

export async function loadMetrics(company: Company, listing: Listing, providers: readonly RegisteredProvider[],
  context: ProviderContext, asOf: string) {
  const [financials, quote, history] = await Promise.all([
    loadFinancials(company, providers, context),
    loadProviderBlock(quoteSchema, providers.filter(({ adapter }) => adapter.capabilities.has('quote') && adapter.quote)
      .map(({ adapter }) => async (ctx) => {
        const block = await adapter.quote!(listing, ctx)
        if (block.data && (block.data.listingId !== listing.id || block.data.unit.currency !== listing.currency)) {
          throw new Error('IDENTITY_INVALID')
        }
        return block
      }), context),
    loadProviderBlock(historySchema, providers.filter(({ adapter }) => adapter.capabilities.has('history') && adapter.history)
      .map(({ adapter }) => async (ctx) => {
        const block = await adapter.history!(listing, '1y', ctx)
        if (block.data && (block.data.listingId !== listing.id || block.data.unit.currency !== listing.currency ||
          block.data.range !== '1y')) throw new Error('IDENTITY_INVALID')
        return block
      }), context),
  ])
  const blocks: DataBlock<unknown>[] = [financials, quote, history].filter((block) => block.data !== null)
  if (!blocks.length) {
    const limited = [financials, quote, history].find((block) => block.status === 'rate_limited')
    return limited ? { ...limited, data: null } : emptyBlock(context.requestId, financials.reasonCode ?? 'MISSING_INPUTS')
  }
  const data = calculateMetrics({ company, listing, facts: financials.data ?? [], asOf, quote, history,
    factsStale: financials.status === 'stale' })
  const stale = blocks.some((block) => block.status === 'stale')
  const partial = data.some((metric) => metric.value === null)
  const nextAllowed = [financials, quote, history].flatMap((block) => block.nextAllowedRefreshAt ?
    [block.nextAllowedRefreshAt] : []).sort().at(-1) ?? null
  return dataBlockSchema(metricSchema.array().length(32)).parse({
    ...emptyBlock(context.requestId), data, status: stale ? 'stale' : partial ? 'partial' : 'available',
    reasonCode: stale ? 'STALE_INPUT' : partial ? 'PARTIAL_METRICS' : null,
    provenance: [...new Map(blocks.flatMap((block) => block.provenance).map((source) =>
      [JSON.stringify(source), source])).values()],
    nextAllowedRefreshAt: nextAllowed,
    warnings: [...new Set(blocks.flatMap((block) => block.warnings))],
  })
}
