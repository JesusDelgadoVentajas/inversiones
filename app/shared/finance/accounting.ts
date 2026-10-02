import { financialFactSchema } from '../contracts/financial.js'
import type { FinancialFact } from '../contracts/financial.js'
import { utcInstant } from '../contracts/primitives.js'
import { decimalFromScaled, scaledDecimal } from './decimal.js'

export type AccountingValue = { value: string; unit: string; start: string | null; end: string;
  basis: FinancialFact['basis']; attribution: FinancialFact['attribution']; facts: FinancialFact[] }
export class CalculationUnavailable extends Error {}
export const dayAfter = (date: string) => new Date(Date.parse(date) + 86_400_000).toISOString().slice(0, 10)
export const periodDays = (start: string, end: string) =>
  (Date.parse(end) - Date.parse(start)) / 86_400_000 + 1
const filed = (fact: FinancialFact) => fact.filedDate ?? fact.filedAt!.slice(0, 10)
const annual = (fact: FinancialFact) => fact.periodStart !== null &&
  periodDays(fact.periodStart, fact.periodEnd) >= 350 && periodDays(fact.periodStart, fact.periodEnd) <= 380

export function selectedFacts(input: FinancialFact[], asOf: string): FinancialFact[] {
  utcInstant.parse(asOf)
  const groups = new Map<string, FinancialFact[]>()
  for (const item of input) {
    const fact = financialFactSchema.parse(item)
    // Una fecha civil no demuestra a qué hora se publicó en ese mismo día.
    if (fact.periodEnd > asOf.slice(0, 10) || (fact.filedAt
      ? Date.parse(fact.filedAt) > Date.parse(asOf) : filed(fact) >= asOf.slice(0, 10))) continue
    const key = [fact.companyId, fact.concept, fact.unit, fact.basis, fact.attribution,
      fact.listingId, fact.semantics, fact.periodStart, fact.periodEnd].join('|')
    const group = groups.get(key) ?? []
    group.push(fact)
    groups.set(key, group)
  }
  return [...groups.values()].map((group) => {
    const lastDate = group.map(filed).sort().at(-1)!
    let latest = group.filter((fact) => filed(fact) === lastDate)
    if (latest.every((fact) => fact.filedAt !== null)) {
      const lastInstant = Math.max(...latest.map((fact) => Date.parse(fact.filedAt!)))
      latest = latest.filter((fact) => Date.parse(fact.filedAt!) === lastInstant)
    }
    const priority = Math.min(...latest.map((fact) => fact.conceptPriority))
    if (latest.some((fact) => scaledDecimal(fact.value) !== scaledDecimal(latest[0].value)) &&
      latest.some((fact) => fact.conceptPriority !== priority)) throw new CalculationUnavailable('AMBIGUOUS_CONCEPT')
    latest = latest.filter((fact) => fact.conceptPriority === priority)
    if (latest.some((fact) => scaledDecimal(fact.value) !== scaledDecimal(latest[0].value))) {
      throw new CalculationUnavailable('AMBIGUOUS_REVISION')
    }
    return latest[0]
  })
}

export function compatible(values: AccountingValue[], samePeriod = true): void {
  const first = values[0]
  if (!first || values.some((value) => value.unit !== first.unit || value.basis !== first.basis ||
      samePeriod && (value.start !== first.start || value.end !== first.end))) {
    throw new CalculationUnavailable('INCOMPATIBLE_INPUTS')
  }
  if (first.basis === 'unknown') throw new CalculationUnavailable('ACCOUNTING_BASIS_UNKNOWN')
}

export function factValue(fact: FinancialFact): AccountingValue {
  return { value: fact.value, unit: fact.unit, start: fact.periodStart, end: fact.periodEnd,
    basis: fact.basis, attribution: fact.attribution, facts: [fact] }
}

export function instantValue(facts: FinancialFact[], concept: string, end?: string): AccountingValue {
  const candidates = facts.filter((fact) => fact.concept === concept && fact.periodType === 'instant' &&
    (!end || fact.periodEnd === end))
  const latestEnd = candidates.map((fact) => fact.periodEnd).sort().at(-1)
  const latest = candidates.filter((fact) => fact.periodEnd === latestEnd)
  if (!latest.length) throw new CalculationUnavailable('MISSING_INPUTS')
  if (latest.length !== 1) throw new CalculationUnavailable('INCOMPATIBLE_INPUTS')
  return factValue(latest[0])
}

const additive = new Set(['revenue', 'gross_profit', 'operating_income', 'net_income',
  'operating_cash_flow', 'capex', 'cash_dividends_common'])

export function trailingValue(facts: FinancialFact[], concept: string, end?: string): AccountingValue {
  const all = facts.filter((fact) => fact.concept === concept && fact.periodType === 'duration')
  const target = end ?? all.map((fact) => fact.periodEnd).sort().at(-1)
  if (!target) throw new CalculationUnavailable('MISSING_INPUTS')
  const candidates = all.filter((fact) => fact.periodEnd <= target && periodDays(fact.periodEnd, target) <= 400)
  if (candidates.length > 120) throw new CalculationUnavailable('CALCULATION_LIMIT')
  const direct = candidates.filter((fact) => fact.periodEnd === target && annual(fact))
  if (direct.length === 1) return factValue(direct[0])
  if (direct.length > 1) throw new CalculationUnavailable('INCOMPATIBLE_INPUTS')
  if (!additive.has(concept)) throw new CalculationUnavailable('ADDITIVE_DERIVATION_FORBIDDEN')
  const quarters: AccountingValue[] = []
  for (const fact of candidates) {
    if (periodDays(fact.periodStart!, fact.periodEnd) >= 60 &&
        periodDays(fact.periodStart!, fact.periodEnd) <= 120) quarters.push(factValue(fact))
    for (const earlier of candidates) {
      if (earlier.periodStart !== fact.periodStart || earlier.periodEnd >= fact.periodEnd) continue
      const start = dayAfter(earlier.periodEnd)
      const days = periodDays(start, fact.periodEnd)
      if (days < 60 || days > 120) continue
      const values = [factValue(fact), factValue(earlier)]
      try { compatible(values, false) } catch { continue }
      if (fact.attribution !== earlier.attribution) continue
      quarters.push({ ...factValue(fact), start,
        value: decimalFromScaled(scaledDecimal(fact.value) - scaledDecimal(earlier.value)),
        facts: [earlier, fact] })
    }
  }
  const distinct = new Map<string, AccountingValue>()
  for (const quarter of quarters) {
    const key = [quarter.start, quarter.end, quarter.unit, quarter.basis, quarter.attribution, quarter.value].join('|')
    const known = distinct.get(key)
    if (!known || quarter.facts.length < known.facts.length) distinct.set(key, quarter)
  }
  const paths: AccountingValue[][] = []
  let steps = 0
  const walk = (ending: string, path: AccountingValue[]) => {
    if (++steps > 1024) throw new CalculationUnavailable('CALCULATION_LIMIT')
    if (path.length === 4) { paths.push([...path].reverse()); return }
    for (const quarter of [...distinct.values()].filter((value) => value.end === ending)) {
      const previousDay = new Date(Date.parse(quarter.start!) - 86_400_000).toISOString().slice(0, 10)
      walk(previousDay, [...path, quarter])
    }
  }
  walk(target, [])
  const valid = paths.filter((path) => {
    try { compatible(path, false) } catch { return false }
    return path.every((value) => value.attribution === path[0].attribution) &&
      periodDays(path[0].start!, target) >= 350 && periodDays(path[0].start!, target) <= 380
  })
  if (!valid.length) throw new CalculationUnavailable('INCOMPLETE_TTM')
  const sums = valid.map((path) => path.reduce((sum, value) => sum + scaledDecimal(value.value), 0n))
  if (sums.some((sum) => sum !== sums[0])) throw new CalculationUnavailable('AMBIGUOUS_PERIOD')
  const path = valid.sort((a, b) => a.flatMap((value) => value.facts).length -
    b.flatMap((value) => value.facts).length)[0]
  return { ...path[0], value: decimalFromScaled(sums[0]), end: target,
    facts: [...new Set(path.flatMap((value) => value.facts))] }
}
