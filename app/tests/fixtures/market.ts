import type { VerifiedCandidate } from '../../shared/contracts/search.js'
import type { PriceHistory } from '../../shared/contracts/financial.js'
import { companyId, listingId, provenance, quote } from './contracts.js'

export function candidate(name = 'Empresa sintética'): VerifiedCandidate {
  return {
    company: { id: companyId, legalName: name, aliases: [], country: 'GB', sector: null,
      website: null, identifiers: { synthetic: 'issuer-1' } },
    listings: [{ id: listingId, companyId, symbol: 'SYN', mic: 'XLON', currency: 'GBP',
      instrument: 'ordinary', shareClass: null, status: 'active', timeZone: 'Europe/London' }],
    mappings: [
      { id: '44444444-4444-4444-8444-444444444444', provider: 'synthetic-provider',
        companyId, listingId: null, externalId: 'issuer-1', verifiedAt: provenance.checkedAt },
      { id: '55555555-5555-4555-8555-555555555555', provider: 'synthetic-provider',
        companyId: null, listingId, externalId: 'listing-1', verifiedAt: provenance.checkedAt },
    ],
  }
}

export const history: PriceHistory = {
  listingId, range: '1y', availableRanges: ['1y'], adjustment: 'split_adjusted',
  resolution: 'day', unit: quote.unit, feed: 'test',
  bars: ['2026-09-25', '2026-09-28'].map((day, index) => ({
    listingId, startsAt: `${day}T08:00:00Z`, endsAt: `${day}T16:30:00Z`,
    resolution: 'day', open: null, high: null, low: null, close: index === 0 ? '10' : '12.34',
    volume: null, unit: quote.unit, adjustment: 'split_adjusted', provenance,
  })),
}
