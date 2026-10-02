import type { DataBlock, Provenance } from '../../shared/contracts/blocks.js'
import type { Quote } from '../../shared/contracts/financial.js'

export const companyId = '11111111-1111-4111-8111-111111111111'
export const listingId = '22222222-2222-4222-8222-222222222222'
export const requestId = '33333333-3333-4333-8333-333333333333'

export const provenance = {
  provider: 'synthetic-provider', sourceUrl: 'https://example.org/source',
  retrievedAt: '2026-10-02T10:00:00Z', checkedAt: '2026-10-02T10:00:00Z',
  observedAt: '2026-10-02T09:59:00Z', publishedAt: null,
  periodStart: null, periodEnd: null, delaySeconds: 60, feed: 'test',
  methodologyVersion: 'v1',
} satisfies Provenance

export const quote = {
  listingId, price: '12.34', unit: { currency: 'GBP', unit: 'GBX', unitToMajor: '0.01' },
  observedAt: '2026-10-02T09:59:00Z', session: 'regular', feed: 'test',
  coverage: 'Fixture sintético sin mercado real',
  previousClose: null,
} satisfies Quote

export const quoteBlock = {
  status: 'available', data: quote, provenance: [provenance],
  servedAt: '2026-10-02T10:00:01Z', fromCache: false, cacheAgeSeconds: null,
  nextAllowedRefreshAt: null, warnings: [], reasonCode: null, requestId,
} satisfies DataBlock<Quote>
