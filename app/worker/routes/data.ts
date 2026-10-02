import { dataBlockSchema } from '../../shared/contracts/blocks.js'
import { historySchema, priceRangeSchema, quoteSchema } from '../../shared/contracts/financial.js'
import { stableId } from '../../shared/contracts/primitives.js'
import { rankCandidates, searchCandidateSchema, searchQuerySchema, verifiedCandidateSchema } from '../../shared/contracts/search.js'
import { readProfile, saveIdentity } from '../identity/store.js'
import type { RegisteredProvider } from '../providers/registry.js'
import { emptyBlock, loadProviderBlock } from '../services/provider-block.js'
import { apiError } from './errors.js'
import { privateJson } from './json.js'
import { researchRoute, serveResearch } from './research.js'

export function createDataApi(db: D1Database | undefined, providers: readonly RegisteredProvider[]) {
  return async (request: Request, requestId: string): Promise<Response> => {
    const url = new URL(request.url)
    const match = url.pathname.match(/^\/api\/v1\/listings\/([^/]+)\/(profile|quote|prices)$/)
    if (!match && !researchRoute(url.pathname) && !['/api/v1/search', '/api/v1/capabilities'].includes(url.pathname)) {
      return apiError(404, 'NOT_FOUND', 'Ruta no disponible.', requestId)
    }
    const json = (body: unknown) => privateJson(body, requestId)
    if (request.method !== 'GET') {
      const response = apiError(405, 'METHOD_NOT_ALLOWED', 'Método no disponible.', requestId)
      response.headers.set('Allow', 'GET')
      return response
    }
    if (researchRoute(url.pathname)) return serveResearch(request, requestId, db, providers)
    const context = { requestId, signal: request.signal }
    if (url.pathname === '/api/v1/capabilities') {
      return json({
        search: providers.some(({ adapter, identityRetentionAllowed }) => identityRetentionAllowed &&
          adapter.capabilities.has('search') && !!adapter.search),
        ...Object.fromEntries((['quote', 'history', 'financials', 'news'] as const).map((capability) =>
          [capability, providers.some(({ adapter }) => adapter.capabilities.has(capability) && !!adapter[capability])])),
      })
    }
    if (url.pathname === '/api/v1/search') {
      const query = searchQuerySchema.safeParse(url.searchParams.get('q'))
      if (!query.success || url.searchParams.getAll('q').length !== 1 || [...url.searchParams.keys()].some((key) => key !== 'q')) {
        return apiError(400, 'INVALID_QUERY', 'Usa un nombre de empresa de 2–80 caracteres.', requestId)
      }
      if (!db) return apiError(503, 'STORAGE_UNAVAILABLE', 'La búsqueda no está disponible.', requestId)
      const enabled = providers.filter(({ adapter, identityRetentionAllowed }) =>
        identityRetentionAllowed && adapter.capabilities.has('search') && adapter.search)
      const block = await loadProviderBlock(verifiedCandidateSchema.array().max(20), enabled.map(({ adapter }) =>
        async (ctx) => {
          const result = await adapter.search?.(query.data, ctx) ?? emptyBlock(ctx.requestId)
          if (result.data?.some((item) => item.mappings.some((mapping) => mapping.provider !== adapter.id))) {
            throw new Error('IDENTITY_INVALID')
          }
          return result
        }), context)
      if (block.data) {
        const eligible = block.data.map((candidate) => {
          const listings = candidate.listings.filter((listing) => !['fund', 'other'].includes(listing.instrument))
          const targets = new Set([candidate.company.id, ...listings.map((listing) => listing.id)])
          return { ...candidate, listings, mappings: candidate.mappings.filter((mapping) => targets.has(mapping.companyId ?? mapping.listingId ?? '')) }
        }).filter((candidate) => candidate.listings.length > 0)
        if (block.data.length > 0 && eligible.length === 0) return json(emptyBlock(requestId, 'EXCLUDED_INSTRUMENT'))
        for (const candidate of eligible) {
          const provider = candidate.mappings[0]?.provider
          if (!provider || !enabled.some(({ adapter }) => adapter.id === provider)) throw new Error('IDENTITY_INVALID')
          await saveIdentity(db, candidate, provider)
        }
        const candidates = eligible.map((candidate) => searchCandidateSchema.parse(candidate))
        return json(dataBlockSchema(searchCandidateSchema.array().max(20)).parse({ ...block,
          data: rankCandidates(candidates, query.data) }))
      }
      return json(block)
    }
    if (!match) return apiError(404, 'NOT_FOUND', 'Ruta no disponible.', requestId)
    const id = stableId.safeParse(match[1])
    const range = priceRangeSchema.safeParse(url.searchParams.get('range') ?? '1y')
    if (!id.success || !range.success || [...url.searchParams.keys()].some((key) => key !== 'range') ||
      url.searchParams.getAll('range').length > 1 || match[2] !== 'prices' && url.searchParams.size > 0) {
      return apiError(400, 'INVALID_PARAMETERS', 'Parámetros no válidos.', requestId)
    }
    if (!db) return apiError(503, 'STORAGE_UNAVAILABLE', 'La ficha no está disponible.', requestId)
    const profile = await readProfile(db, id.data)
    if (!profile) return apiError(404, 'LISTING_NOT_FOUND', 'No encontramos ese instrumento.', requestId)
    if (match[2] === 'profile') return json(profile)
    const capability = match[2] === 'quote' ? 'quote' : 'history'
    const enabled = providers.filter(({ adapter }) => adapter.capabilities.has(capability))
    if (capability === 'quote') {
      const block = await loadProviderBlock(quoteSchema, enabled.filter(({ adapter }) => adapter.quote)
        .map(({ adapter }) => (ctx) => adapter.quote?.(profile.listing, ctx) ?? Promise.resolve(emptyBlock(ctx.requestId))), context)
      if (block.data && (block.data.listingId !== id.data || block.data.unit.currency !== profile.listing.currency)) {
        throw new Error('IDENTITY_INVALID')
      }
      return json(block)
    }
    const block = await loadProviderBlock(historySchema, enabled.filter(({ adapter }) => adapter.history)
      .map(({ adapter }) => (ctx) => adapter.history?.(profile.listing, range.data, ctx) ?? Promise.resolve(emptyBlock(ctx.requestId))), context)
    if (block.data && (block.data.listingId !== id.data || block.data.range !== range.data ||
      block.data.unit.currency !== profile.listing.currency)) throw new Error('IDENTITY_INVALID')
    return json(block)
  }
}
