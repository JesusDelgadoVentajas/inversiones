import { financialFactSchema } from '../../shared/contracts/financial.js'
import type { FinancialFact } from '../../shared/contracts/financial.js'
import type { NewsItem } from '../../shared/contracts/context.js'
import { companyId, listingId, provenance } from './contracts.js'

// Importes y empresas inventados; ningún cuerpo de proveedor real.
export function fact(concept: string, value: string, changes: Partial<FinancialFact> = {}): FinancialFact {
  const instant = ['cash', 'equity', 'common_equity', 'current_assets', 'current_liabilities',
    'debt_total'].includes(concept)
  return financialFactSchema.parse({ companyId, concept, value, unit: 'GBP', sourceScale: 0,
    periodType: instant ? 'instant' : 'duration', periodStart: instant ? null : '2025-01-01',
    periodEnd: '2025-12-31', filedDate: '2026-02-01', filedAt: null,
    basis: 'us-gaap', attribution: ['net_income', 'equity'].includes(concept) ? 'parent' :
      ['common_equity', 'net_income_common', 'cash_dividends_common'].includes(concept) ? 'common' : 'issuer',
    semantics: concept === 'capex' ? 'outflow_positive' : concept === 'debt_total' ? 'debt_excludes_leases' : 'reported',
    documentUrl: 'https://example.org/synthetic-filing', provenance, ...changes })
}

export const financials = [
  fact('revenue', '400'), fact('revenue', '320', { periodStart: '2024-01-01', periodEnd: '2024-12-31' }),
  fact('gross_profit', '160'), fact('operating_income', '80'), fact('net_income', '40'),
  fact('net_income', '20', { periodStart: '2024-01-01', periodEnd: '2024-12-31' }),
  fact('cash', '100'), fact('debt_total', '70'), fact('equity', '140'),
  fact('equity', '100', { periodEnd: '2024-12-31' }), fact('common_equity', '100'),
  fact('operating_cash_flow', '60'), fact('capex', '100'),
  fact('current_assets', '120'), fact('current_liabilities', '60'),
  fact('cash_dividends_common', '10'), fact('net_income_common', '40'),
  fact('eps_diluted', '2', { unit: 'GBP/shares', listingId, shareBasis: 'verified_current', attribution: 'common' }),
]

export function news(index = 0, changes: Partial<NewsItem> = {}): NewsItem {
  return { id: 'aaaaaaaa-aaaa-4aaa-8aaa-' + String(index).padStart(12, '0'),
    title: 'Noticia sintética ' + index, url: 'https://example.org/articles/' + index,
    source: 'Medio sintético', publishedAt: '2026-09-20T12:00:00Z', publishedDate: null,
    language: 'es', kind: 'independent', relationKind: 'explicit_reference', companyIds: [companyId],
    dateKind: 'publication',
    relationReason: 'El texto identifica al emisor sintético y su mercado.', ...changes }
}
