import { metricSchema, quoteSchema, historySchema } from '../contracts/financial.js'
import type { FinancialFact, Metric, Quote, PriceHistory } from '../contracts/financial.js'
import type { DataBlock, Provenance } from '../contracts/blocks.js'
import type { Company, Listing } from '../contracts/identity.js'
import { CalculationUnavailable, compatible, instantValue, selectedFacts,
  trailingValue, periodDays, dayAfter } from './accounting.js'
import type { AccountingValue } from './accounting.js'
import { DECIMAL_SCALE, decimalFromScaled, roundedRatio, scaledDecimal } from './decimal.js'
import { metricCatalog, metricReasons } from './metric-catalog.js'
import type { MetricId } from './metric-catalog.js'
import { priceChange } from './price-change.js'
import { ZodError } from 'zod'

type Operand = AccountingValue & { name: string; market?: boolean; stale?: boolean;
  provenance?: Provenance[]; listingId?: string | null }
type Options = { company: Company; listing: Listing; facts: FinancialFact[]; asOf: string;
  factsStale?: boolean; quote?: DataBlock<Quote> | null; history?: DataBlock<PriceHistory> | null }
const fail = (reason: string): never => { throw new CalculationUnavailable(reason) }
const number = (value: Operand) => scaledDecimal(value.value)
const decimalRatio = (a: bigint, b: bigint, percent = false) =>
  decimalFromScaled(roundedRatio(a * (percent ? 100n : 1n) * 1_000_000n, b), 6)

export function calculateMetrics(options: Options): Metric[] {
  const { company, listing, asOf } = options
  if (listing.companyId !== company.id) throw new Error('IDENTITY_INVALID')
  if (options.facts.length > 1000) throw new CalculationUnavailable('CALCULATION_LIMIT')
  const used = new Map<string, Operand>()
  const facts = (concept: string) => selectedFacts(options.facts.filter((fact) =>
    fact.companyId === company.id && fact.concept === concept), asOf)
  const flow = (concept: string, end?: string): Operand => ({ ...trailingValue(facts(concept), concept, end),
    name: concept, stale: options.factsStale })
  const balance = (concept: string, end?: string): Operand => ({ ...instantValue(facts(concept), concept, end),
    name: concept, stale: options.factsStale })
  const quote = () => {
    const block = options.quote
    if (!block?.data || !block.provenance.length) return fail('MISSING_INPUTS')
    const data = quoteSchema.parse(block.data)
    if (data.listingId !== listing.id || data.unit.currency !== listing.currency ||
        Date.parse(data.observedAt) > Date.parse(asOf)) return fail('INCOMPATIBLE_INPUTS')
    return { block, data }
  }
  const market = (name: string): Operand => {
    const { data, block } = quote()
    const raw = name === 'volume' ? data.sessionVolume : data.price
    if (raw === null) return fail('MISSING_INPUTS')
    const value = name === 'volume' ? raw : decimalFromScaled(
      roundedRatio(scaledDecimal(raw) * scaledDecimal(data.unit.unitToMajor), DECIMAL_SCALE))
    return { value, unit: name === 'volume' ? 'shares' : data.unit.currency,
      start: null, end: data.observedAt.slice(0, 10), basis: 'unknown', attribution: 'issuer',
      facts: [], provenance: block.provenance, listingId: listing.id,
      name, market: true, stale: block.status === 'stale' }
  }
  const operand = (name: string): Operand => {
    if (used.has(name)) return used.get(name)!
    let value: Operand
    if (name === 'price' || name === 'volume') value = market(name)
    else if (name === 'market_cap') {
      const { data, block } = quote()
      const capitalization = data.capitalization
      if (!capitalization) return fail('MISSING_INPUTS')
      if (capitalization.companyId !== company.id || capitalization.currency !== listing.currency ||
        capitalization.observedAt.slice(0, 10) !== data.observedAt.slice(0, 10) ||
        Date.parse(capitalization.observedAt) > Date.parse(asOf)) fail('INCOMPATIBLE_INPUTS')
      value = { name, value: capitalization.value, unit: capitalization.currency, start: null,
        end: capitalization.observedAt.slice(0, 10), basis: 'unknown', attribution: 'common',
        facts: [], market: true, stale: block.status === 'stale', provenance: [capitalization.provenance] }
    } else if (name === 'debt') {
      const total = facts('debt_total')
      if (total.length) value = { ...instantValue(total, 'debt_total'), name, stale: options.factsStale }
      else {
        const parts = ['long_term_debt_current', 'long_term_debt_noncurrent', 'short_term_debt']
          .map((concept) => balance(concept))
        compatible(parts)
        value = { ...parts[0], name, value: decimalFromScaled(parts.reduce((sum, part) => sum + number(part), 0n)),
          facts: parts.flatMap((part) => part.facts) }
      }
      if (value.facts.some((fact) => fact.semantics !== 'debt_excludes_leases')) fail('DEBT_DEFINITION_UNVERIFIED')
    } else if (name === 'fcf') {
      const parts = [operand('operating_cash_flow'), operand('capex')]
      compatible(parts)
      value = { ...parts[0], name, value: decimalFromScaled(number(parts[0]) - number(parts[1])),
        facts: parts.flatMap((part) => part.facts) }
    } else if (name.endsWith('_previous')) {
      const current = operand(name.replace('_previous', ''))
      if (!current.start) return fail('INCOMPATIBLE_INPUTS')
      const end = new Date(Date.parse(current.start) - 86_400_000).toISOString().slice(0, 10)
      value = flow(name.replace('_previous', ''), end)
    } else if (name === 'equity_average') {
      const income = operand('net_income')
      if (!income.start) return fail('INCOMPATIBLE_INPUTS')
      const previousDay = new Date(Date.parse(income.start) - 86_400_000).toISOString().slice(0, 10)
      const parts = [balance('equity', previousDay), balance('equity', income.end)]
      compatible(parts, false)
      if (parts.some((part) => number(part) <= 0n || part.attribution !== income.attribution)) {
        fail('ATTRIBUTION_INCOMPATIBLE')
      }
      value = { ...income, name, value: decimalFromScaled(roundedRatio(number(parts[0]) + number(parts[1]), 2n)),
        facts: parts.flatMap((part) => part.facts) }
    } else if (['cash', 'equity', 'common_equity', 'current_assets', 'current_liabilities'].includes(name)) value = balance(name)
    else value = flow(name)
    if (!value.market && value.basis === 'unknown') fail('ACCOUNTING_BASIS_UNKNOWN')
    if (name === 'net_income' && value.attribution !== 'parent') fail('ATTRIBUTION_INCOMPATIBLE')
    if (name === 'equity' && value.attribution !== 'parent' ||
      ['common_equity', 'net_income_common', 'cash_dividends_common'].includes(name) && value.attribution !== 'common') {
      fail('ATTRIBUTION_INCOMPATIBLE')
    }
    if (['cash', 'debt', 'market_cap', 'dividend_per_share'].includes(name) && number(value) < 0n) fail('INCOMPATIBLE_INPUTS')
    if (name === 'capex' && (number(value) < 0n || value.facts.some((fact) => fact.semantics !== 'outflow_positive'))) {
      fail('CAPEX_SIGN_INVALID')
    }
    if (['eps_diluted', 'dividend_per_share'].includes(name)) {
      if (value.facts.some((fact) => fact.listingId !== listing.id || fact.shareBasis !== 'verified_current') ||
          !['ordinary', 'preferred'].includes(listing.instrument) || value.unit !== listing.currency + '/shares') {
        fail('SHARE_BASIS_UNVERIFIED')
      }
      if (name === 'dividend_per_share') {
        const anniversary = new Date(asOf.slice(0, 10))
        const month = anniversary.getUTCMonth()
        anniversary.setUTCFullYear(anniversary.getUTCFullYear() - 1)
        if (anniversary.getUTCMonth() !== month) anniversary.setUTCDate(0)
        const start = dayAfter(anniversary.toISOString().slice(0, 10))
        if (value.end !== asOf.slice(0, 10) || value.start !== start) fail('INCOMPATIBLE_INPUTS')
      }
    }
    used.set(name, value)
    return value
  }
  const amounts = new Map<MetricId, string>([
    ['M03', 'market_cap'], ['M04', 'volume'], ['M07', 'revenue'], ['M09', 'net_income'],
    ['M11', 'eps_diluted'], ['M15', 'cash'], ['M16', 'debt'], ['M18', 'equity'],
    ['M19', 'operating_cash_flow'], ['M20', 'capex'], ['M21', 'fcf'], ['M30', 'dividend_per_share'],
  ])
  const ratios = new Map<MetricId, [string, string]>([
    ['M08', ['revenue', 'revenue_previous']], ['M10', ['net_income', 'net_income_previous']],
    ['M12', ['gross_profit', 'revenue']], ['M13', ['operating_income', 'revenue']],
    ['M14', ['net_income', 'revenue']], ['M22', ['fcf', 'revenue']],
    ['M23', ['price', 'eps_diluted']], ['M24', ['market_cap', 'revenue']],
    ['M25', ['market_cap', 'common_equity']], ['M26', ['fcf', 'market_cap']],
    ['M27', ['net_income', 'equity_average']], ['M28', ['current_assets', 'current_liabilities']],
    ['M29', ['debt', 'equity']], ['M31', ['dividend_per_share', 'price']],
    ['M32', ['cash_dividends_common', 'net_income_common']],
  ])

  return metricCatalog.map(([id, title, formula, kind]) => {
    const inputs: Operand[] = []
    let value: string | null = null
    let reason: string | null = null
    let status: Metric['status'] = 'available'
    let detail = ''
    try {
      if (['M12', 'M13', 'M28'].includes(id) && /\b(bank|banking|insurance|banco|aseguradora)\b/i.test(company.sector ?? '')) {
        status = 'not_applicable'; fail('SECTOR_NOT_APPLICABLE')
      }
      if (id === 'M01') {
        const current = quote()
        const change = priceChange(current.data)
        if (!change.available) return fail(change.reason)
        value = change.percent
        const price = market('price')
        inputs.push(price, { ...price, name: 'previous_close',
          value: decimalFromScaled(roundedRatio(scaledDecimal(current.data.previousClose!.price) *
            scaledDecimal(current.data.unit.unitToMajor), DECIMAL_SCALE)),
          end: current.data.previousClose!.observedAt.slice(0, 10),
          provenance: [current.data.previousClose!.provenance] })
      } else if (['M02', 'M05', 'M06'].includes(id)) {
        const block = options.history
        if (!block?.data || !block.provenance.length) return missing(id, title, formula, 'HISTORICAL_COVERAGE_MISSING', kind)
        const history = historySchema.parse(block.data)
        const bars = history.bars.filter((bar) => Date.parse(bar.endsAt) <= Date.parse(asOf))
        if (history.listingId !== listing.id || history.unit.currency !== listing.currency ||
          history.adjustment !== 'split_adjusted' || history.resolution !== 'day' || history.range !== '1y' ||
          history.coverage !== 'complete' ||
          !bars.length || periodDays(bars[0].startsAt.slice(0, 10), bars.at(-1)!.startsAt.slice(0, 10)) < 350 ||
          periodDays(bars[0].startsAt.slice(0, 10), bars.at(-1)!.startsAt.slice(0, 10)) > 380) {
          fail('HISTORICAL_COVERAGE_MISSING')
        }
        const first = bars[0], last = bars.at(-1)!
        const source = (amount: string, name: string, bar = last): Operand => ({
          name, value: decimalFromScaled(roundedRatio(scaledDecimal(amount) *
            scaledDecimal(history.unit.unitToMajor), DECIMAL_SCALE)),
          unit: history.unit.currency, start: first.startsAt.slice(0, 10), end: last.endsAt.slice(0, 10),
          basis: 'unknown', attribution: 'issuer', market: true, listingId: listing.id, facts: [],
          stale: block.status === 'stale', provenance: [bar.provenance] })
        if (id === 'M02') {
          inputs.push(source(last.close, 'final_close'), source(first.close, 'initial_close', first))
          if (number(inputs[1]) <= 0n) fail('NON_POSITIVE_BASE')
          value = decimalRatio(number(inputs[0]) - number(inputs[1]), number(inputs[1]), true)
        } else {
          const values = bars.map((bar) => id === 'M05' ? bar.high : bar.low)
          if (values.some((amount) => amount === null)) fail('HISTORICAL_COVERAGE_MISSING')
          const extreme = values.reduce((best, amount) => best === null || (id === 'M05'
            ? scaledDecimal(amount!) > scaledDecimal(best) : scaledDecimal(amount!) < scaledDecimal(best)) ? amount : best, null)
          inputs.push(source(extreme!, 'annual_extreme', bars[values.indexOf(extreme)]))
          value = inputs[0].value
        }
      } else if (id === 'M17') {
        inputs.push(operand('debt'), operand('cash')); compatible(inputs)
        value = decimalFromScaled(number(inputs[0]) - number(inputs[1]))
      } else if (amounts.has(id)) {
        inputs.push(operand(amounts.get(id)!)); value = inputs[0].value
      } else {
        const pair = ratios.get(id)!
        inputs.push(...pair.map(operand))
        const [a, b] = inputs
        const growth = id === 'M08' || id === 'M10'
        const perShare = id === 'M23' || id === 'M31'
        const mixedPeriod = growth || inputs.some((input) => input.market)
        if (perShare) {
          if (a.unit.replace('/shares', '') !== b.unit.replace('/shares', '')) fail('INCOMPATIBLE_INPUTS')
        } else {
          if (a.unit !== b.unit) fail('INCOMPATIBLE_INPUTS')
          const accounting = inputs.filter((input) => !input.market)
          if (accounting.length) compatible(accounting, !mixedPeriod)
        }
        if (growth && (a.attribution !== b.attribution || b.end >= a.start!)) fail('INCOMPATIBLE_INPUTS')
        if (id === 'M32' && inputs.some((input) => input.attribution !== 'common')) fail('ATTRIBUTION_INCOMPATIBLE')
        if (number(b) <= 0n) {
          if (growth) detail = '. Cambio absoluto: ' + decimalFromScaled(number(a) - number(b)) + ' ' + a.unit
          fail('NON_POSITIVE_BASE')
        }
        value = decimalRatio(growth ? number(a) - number(b) : number(a), number(b), kind === 'percent')
      }
      if (inputs.some((input) => input.stale)) { status = 'stale'; reason = 'STALE_INPUT' }
    } catch (error) {
      value = null; status = status === 'not_applicable' ? status : 'unavailable'
      if (error instanceof CalculationUnavailable) reason = error.message
      else if (error instanceof ZodError) reason = 'INVALID_FINANCIAL_INPUTS'
      else throw error
    }
    const metric = { id, value, unit: kind === 'percent' ? '%' : kind === 'ratio' ? 'ratio' :
      kind === 'shares' ? 'shares' : inputs[0]?.unit ?? 'unknown',
      formulaVersion: 'v1', inputs: inputs.map((input) => ({ name: input.name, value: input.value,
        unit: input.unit, companyId: company.id, listingId: input.listingId ?? input.facts[0]?.listingId ?? null,
        periodStart: input.start, periodEnd: input.end,
        provenance: [...new Map((input.provenance ?? input.facts.map((fact) => fact.provenance))
          .map((source) => [JSON.stringify(source), source])).values()] })),
      periodStart: inputs.find((input) => input.start)?.start ?? null,
      periodEnd: inputs.find((input) => !input.market)?.end ?? inputs[0]?.end ?? null,
      status, explanation: title + '. ' + formula + (reason ? '. ' + (metricReasons[reason] ??
        'Falta una referencia compatible y verificada.') : '') + detail, reasonCode: reason }
    const parsed = metricSchema.safeParse(metric)
    return parsed.success ? parsed.data : missing(id, title, formula, 'NUMERIC_RANGE', kind)
  })
}

function missing(id: MetricId, title: string, formula: string, reason: string, kind: string): Metric {
  return { id, value: null, unit: kind === 'percent' ? '%' : kind === 'ratio' ? 'ratio' : 'unknown',
    formulaVersion: 'v1', inputs: [], periodStart: null, periodEnd: null, status: 'unavailable',
    explanation: title + '. ' + formula + '. ' + (metricReasons[reason] ?? 'Faltan entradas compatibles.'),
    reasonCode: reason }
}
