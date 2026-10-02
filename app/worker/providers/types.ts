import type { Company, Listing } from '../../shared/contracts/identity.js'
import type { VerifiedCandidate } from '../../shared/contracts/search.js'
import type { DataBlock } from '../../shared/contracts/blocks.js'
import type { Event, NewsItem, Peer } from '../../shared/contracts/context.js'
import type { FinancialFact, Metric, PriceHistory, PriceRange, Quote } from '../../shared/contracts/financial.js'

export type Capability = 'search' | 'quote' | 'history' | 'financials' | 'news' | 'events' | 'peers'
export interface ProviderContext { requestId: string; signal: AbortSignal }

// Una capacidad ausente significa que el adaptador no la ofrece: jamás se simula un resultado.
export interface ProviderAdapter {
  readonly id: string
  readonly capabilities: ReadonlySet<Capability>
  search?(name: string, context: ProviderContext): Promise<DataBlock<VerifiedCandidate[]>>
  quote?(listing: Listing, context: ProviderContext): Promise<DataBlock<Quote>>
  history?(listing: Listing, range: PriceRange, context: ProviderContext): Promise<DataBlock<PriceHistory>>
  financials?(company: Company, context: ProviderContext): Promise<DataBlock<FinancialFact[]>>
  news?(company: Company, cursor: string | null, context: ProviderContext): Promise<DataBlock<NewsItem[]>>
  events?(company: Company, context: ProviderContext): Promise<DataBlock<Event[]>>
  peers?(company: Company, context: ProviderContext): Promise<DataBlock<Peer[]>>
}

export interface MetricComputer {
  compute(facts: FinancialFact[], quote: Quote | null): Metric[]
}
