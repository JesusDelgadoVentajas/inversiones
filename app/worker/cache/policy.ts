export type CacheBlock = 'search' | 'quote' | 'history' | 'financials' |
  'news' | 'events' | 'macro' | 'peers'

const productTtlSeconds: Record<CacheBlock, number> = {
  search: 86400, quote: 10, history: 3600, financials: 86400,
  news: 300, events: 900, macro: 3600, peers: 7 * 86400,
}

export function cacheTtl(block: CacheBlock, permittedRetentionSeconds: number | null): number {
  if (permittedRetentionSeconds === null || permittedRetentionSeconds === 0) return 0
  if (!Number.isSafeInteger(permittedRetentionSeconds) || permittedRetentionSeconds < 0) {
    throw new Error('Retención del proveedor inválida.')
  }
  return Math.min(productTtlSeconds[block], permittedRetentionSeconds)
}
