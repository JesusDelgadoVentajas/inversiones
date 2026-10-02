import { stableId } from '../../shared/contracts/primitives.js'
import { newsKindSchema } from '../../shared/contracts/context.js'
import { parseNewsCursor, InvalidNewsCursor } from '../../shared/news/page.js'
import { readCompany, readProfile } from '../identity/store.js'
import type { RegisteredProvider } from '../providers/registry.js'
import { loadFinancials, loadMetrics, loadNews } from '../services/research.js'
import { apiError } from './errors.js'
import { privateJson } from './json.js'

export function researchRoute(path: string) {
  return path.match(/^\/api\/v1\/(companies|listings)\/([^/]+)\/(financials|news|metrics)$/)
}

export async function serveResearch(request: Request, requestId: string, db: D1Database | undefined,
  providers: readonly RegisteredProvider[]): Promise<Response> {
  const url = new URL(request.url)
  const match = researchRoute(url.pathname)
  if (!match || (match[1] === 'listings') !== (match[3] === 'metrics')) {
    return apiError(404, 'NOT_FOUND', 'Ruta no disponible.', requestId)
  }
  const id = stableId.safeParse(match[2])
  const kind = newsKindSchema.safeParse(url.searchParams.get('kind') ?? 'all')
  const cursor = url.searchParams.get('cursor')
  if (!id.success || !kind.success || [...url.searchParams.keys()].some((key) => !['kind', 'cursor'].includes(key)) ||
    ['kind', 'cursor'].some((key) => url.searchParams.getAll(key).length > 1) ||
    match[3] !== 'news' && url.searchParams.size > 0) {
    return apiError(400, 'INVALID_PARAMETERS', 'Parámetros no válidos.', requestId)
  }
  const asOf = new Date().toISOString()
  try {
    if (match[3] === 'news') {
      if (url.searchParams.has('cursor') && !cursor) throw new InvalidNewsCursor()
      parseNewsCursor(cursor, id.data, kind.data, asOf)
    }
  } catch (error) {
    if (error instanceof InvalidNewsCursor) return apiError(400, 'INVALID_CURSOR', 'La página de noticias no es válida.', requestId)
    throw error
  }
  if (!db) return apiError(503, 'STORAGE_UNAVAILABLE', 'La ficha no está disponible.', requestId)
  const context = { requestId, signal: AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]) }
  if (match[3] === 'metrics') {
    const profile = await readProfile(db, id.data)
    if (!profile) return apiError(404, 'LISTING_NOT_FOUND', 'No encontramos ese instrumento.', requestId)
    return privateJson(await loadMetrics(profile.company, profile.listing, providers, context, asOf), requestId)
  }
  const company = await readCompany(db, id.data)
  if (!company) return apiError(404, 'COMPANY_NOT_FOUND', 'No encontramos ese emisor.', requestId)
  return privateJson(match[3] === 'financials' ? await loadFinancials(company, providers, context) :
    await loadNews(company, providers, context, { kind: kind.data, cursor, asOf }), requestId)
}
