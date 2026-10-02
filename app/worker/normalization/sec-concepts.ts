import { z } from 'zod'
import { financialFactSchema } from '../../shared/contracts/financial.js'
import type { FinancialFact } from '../../shared/contracts/financial.js'
import { civilDate, stableId, utcInstant, decimal } from '../../shared/contracts/primitives.js'

// Tabla explícita: nunca buscar equivalencias por semejanza de palabras.
export const secConcepts: Record<string, { concept: string; period: 'instant' | 'duration';
  attribution: FinancialFact['attribution']; priority?: number; semantics?: string }> = {
  RevenueFromContractWithCustomerExcludingAssessedTax: { concept: 'revenue', period: 'duration', attribution: 'issuer' },
  Revenues: { concept: 'revenue', period: 'duration', attribution: 'issuer', priority: 1 },
  SalesRevenueNet: { concept: 'revenue', period: 'duration', attribution: 'issuer', priority: 2 },
  GrossProfit: { concept: 'gross_profit', period: 'duration', attribution: 'issuer' },
  OperatingIncomeLoss: { concept: 'operating_income', period: 'duration', attribution: 'issuer' },
  NetIncomeLoss: { concept: 'net_income', period: 'duration', attribution: 'parent' },
  EarningsPerShareDiluted: { concept: 'eps_diluted', period: 'duration', attribution: 'common' },
  CashAndCashEquivalentsAtCarryingValue: { concept: 'cash', period: 'instant', attribution: 'issuer' },
  StockholdersEquity: { concept: 'equity', period: 'instant', attribution: 'parent' },
  AssetsCurrent: { concept: 'current_assets', period: 'instant', attribution: 'issuer' },
  LiabilitiesCurrent: { concept: 'current_liabilities', period: 'instant', attribution: 'issuer' },
  NetCashProvidedByUsedInOperatingActivities: { concept: 'operating_cash_flow', period: 'duration', attribution: 'issuer' },
  PaymentsToAcquirePropertyPlantAndEquipment: { concept: 'capex', period: 'duration', attribution: 'issuer', semantics: 'outflow_positive' },
  PaymentsOfDividendsCommonStock: { concept: 'cash_dividends_common', period: 'duration', attribution: 'common' },
}
const secFact = z.object({ val: z.union([z.number().finite(), z.string()]),
  start: civilDate.optional(), end: civilDate, filed: civilDate,
  accn: z.string().regex(/^\d{10}-\d{2}-\d{6}$/), form: z.string().max(20) })
const secConcept = z.object({ cik: z.number().int().positive(), taxonomy: z.literal('us-gaap'),
  tag: z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,199}$/),
  units: z.record(z.string().max(32), z.array(secFact).max(5000)) })

function sourceDecimal(value: number | string): string | null {
  if (typeof value === 'string') return decimal.safeParse(value).success ? value : null
  if (Number.isInteger(value) && !Number.isSafeInteger(value)) return null
  const text = String(value)
  if (decimal.safeParse(text).success) return text
  const match = text.match(/^(-?)(\d+)(?:\.(\d+))?e([+-]?\d+)$/)
  if (!match) return null
  const [, sign, integer, fraction = '', exponent] = match
  const position = integer.length + Number(exponent)
  const digits = integer + fraction
  const expanded = sign + (position <= 0 ? '0.' + '0'.repeat(-position) + digits :
    position >= digits.length ? digits + '0'.repeat(position - digits.length) :
      digits.slice(0, position) + '.' + digits.slice(position))
  return decimal.safeParse(expanded).success ? expanded : null
}

export function normalizeSecConcept(input: unknown, options: {
  companyId: string; cik: string; tag: string; retrievedAt: string
}): { facts: FinancialFact[]; rejected: number } {
  stableId.parse(options.companyId); utcInstant.parse(options.retrievedAt)
  if (!/^\d{10}$/.test(options.cik)) throw new Error('INVALID_CIK')
  const data = secConcept.parse(input)
  const mapping = secConcepts[options.tag]
  if (!mapping || data.tag !== options.tag || data.cik !== Number(options.cik)) throw new Error('IDENTITY_OR_CONCEPT_INVALID')
  let rejected = 0
  const facts: FinancialFact[] = []
  for (const [unit, rows] of Object.entries(data.units)) {
    for (const row of rows) {
      const value = sourceDecimal(row.val)
      const validUnit = mapping.concept === 'eps_diluted' ? /^[A-Z]{3}\/shares$/.test(unit) : /^[A-Z]{3}$/.test(unit);
      if (!value || !validUnit ||
        (mapping.period === 'instant') !== (row.start === undefined) ||
        !['10-K', '10-Q', '10-K/A', '10-Q/A'].includes(row.form)) { rejected += 1; continue }
      const documentUrl = 'https://www.sec.gov/Archives/edgar/data/' + data.cik + '/' +
        row.accn.replaceAll('-', '') + '/' + row.accn + '-index.html'
      const parsed = financialFactSchema.safeParse({
        companyId: options.companyId, concept: mapping.concept, value, unit, sourceScale: 0,
        periodType: mapping.period, periodStart: row.start ?? null, periodEnd: row.end,
        filedDate: row.filed, filedAt: null, basis: 'us-gaap', attribution: mapping.attribution,
        sourceTag: data.tag, accession: row.accn, conceptPriority: mapping.priority ?? 0,
        semantics: mapping.semantics ?? 'reported', documentUrl,
        provenance: { provider: 'sec', sourceUrl: documentUrl,
          retrievedAt: options.retrievedAt, checkedAt: options.retrievedAt,
          observedAt: null, publishedAt: null, periodStart: row.start ?? null, periodEnd: row.end,
          delaySeconds: null, feed: null, methodologyVersion: 'sec-concepts-v1' },
      })
      if (parsed.success) facts.push(parsed.data)
      else rejected += 1
    }
  }
  return { facts, rejected }
}
