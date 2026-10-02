import { z } from 'zod'
import { provenanceSchema } from './blocks.js'
import { civilDate, decimal, httpsUrl, monetaryUnit, nonNegativeDecimal, stableId, utcInstant } from './primitives.js'
import { scaledDecimal } from '../finance/decimal.js'

function compareUnsignedDecimal(left: string, right: string): number {
  const a = scaledDecimal(left)
  const b = scaledDecimal(right)
  return a < b ? -1 : a > b ? 1 : 0
}

export const quoteSchema = z.object({
  listingId: stableId,
  price: nonNegativeDecimal.refine((value) => !/^0(?:\.0+)?$/.test(value)),
  unit: monetaryUnit,
  observedAt: utcInstant,
  session: z.enum(['regular', 'pre_market', 'after_hours', 'closed', 'unknown']),
  feed: z.string().min(1).max(80),
  coverage: z.string().min(1).max(160),
  sessionVolume: nonNegativeDecimal.nullable().default(null),
  capitalization: z.object({
    companyId: stableId, value: nonNegativeDecimal, currency: z.string().regex(/^[A-Z]{3}$/),
    scope: z.literal('all_common_classes'), observedAt: utcInstant, provenance: provenanceSchema,
  }).nullable().default(null),
  previousClose: z.object({
    listingId: stableId, price: nonNegativeDecimal,
    unit: monetaryUnit, observedAt: utcInstant, feed: z.string().min(1).max(80),
    adjustment: z.enum(['raw', 'split_adjusted']),
    shareBasis: z.enum(['current_shares', 'unknown']), provenance: provenanceSchema,
  }).nullable().default(null),
})

export const priceRangeSchema = z.enum(['1m', '3m', '1y', '5y', 'max'])
export type PriceRange = z.infer<typeof priceRangeSchema>

export const priceBarSchema = z.object({
  listingId: stableId,
  startsAt: utcInstant,
  endsAt: utcInstant,
  resolution: z.enum(['minute', 'hour', 'day', 'week', 'month']),
  open: nonNegativeDecimal.nullable(),
  high: nonNegativeDecimal.nullable(),
  low: nonNegativeDecimal.nullable(),
  close: nonNegativeDecimal,
  volume: nonNegativeDecimal.nullable(),
  unit: monetaryUnit,
  adjustment: z.enum(['raw', 'split_adjusted', 'total_return']),
  provenance: provenanceSchema,
}).superRefine((bar, context) => {
  if (Date.parse(bar.startsAt) >= Date.parse(bar.endsAt)) {
    context.addIssue({ code: 'custom', message: 'Intervalo de precio invertido.' })
  }
  if (bar.high && bar.low && compareUnsignedDecimal(bar.high, bar.low) < 0) {
    context.addIssue({ code: 'custom', message: 'Máximo menor que mínimo.' })
  }
  if (bar.high && compareUnsignedDecimal(bar.close, bar.high) > 0 ||
      bar.low && compareUnsignedDecimal(bar.close, bar.low) < 0) {
    context.addIssue({ code: 'custom', message: 'Cierre fuera del rango.' })
  }
  if (bar.open && (bar.high && compareUnsignedDecimal(bar.open, bar.high) > 0 ||
      bar.low && compareUnsignedDecimal(bar.open, bar.low) < 0)) {
    context.addIssue({ code: 'custom', message: 'Apertura fuera del rango.' })
  }
})

export const historySchema = z.object({
  listingId: stableId, range: priceRangeSchema,
  availableRanges: priceRangeSchema.array().min(1).max(5),
  adjustment: z.enum(['raw', 'split_adjusted', 'total_return']),
  resolution: z.enum(['minute', 'hour', 'day', 'week', 'month']),
  coverage: z.enum(['complete', 'partial', 'unknown']).default('unknown'),
  unit: monetaryUnit, feed: z.string().min(1).max(80),
  bars: priceBarSchema.array().min(1).max(2000),
}).superRefine((history, context) => {
  if (!history.availableRanges.includes(history.range) || history.bars.some((bar, index) =>
    bar.listingId !== history.listingId || bar.adjustment !== history.adjustment ||
    bar.resolution !== history.resolution || bar.unit.currency !== history.unit.currency ||
    bar.unit.unit !== history.unit.unit || scaledDecimal(bar.unit.unitToMajor) !== scaledDecimal(history.unit.unitToMajor) ||
    bar.provenance.feed !== history.feed || index > 0 && Date.parse(history.bars[index - 1].endsAt) > Date.parse(bar.startsAt))) {
    context.addIssue({ code: 'custom', message: 'Histórico mezclado, duplicado o desordenado.' })
  }
})

export const financialFactSchema = z.object({
  companyId: stableId,
  concept: z.string().regex(/^[a-z][a-z0-9_]{1,79}$/),
  value: decimal,
  unit: z.string().min(1).max(32),
  // Escala original de la fuente; value ya está expandido en la unidad indicada.
  sourceScale: z.number().int().min(-12).max(18),
  periodType: z.enum(['instant', 'duration']),
  periodStart: civilDate.nullable(),
  periodEnd: civilDate,
  filedAt: utcInstant.nullable().default(null),
  filedDate: civilDate.nullable().default(null),
  basis: z.enum(['us-gaap', 'ifrs', 'unknown']).default('unknown'),
  attribution: z.enum(['issuer', 'parent', 'common', 'unknown']).default('unknown'),
  listingId: stableId.nullable().default(null),
  shareBasis: z.enum(['verified_current', 'unknown']).default('unknown'),
  sourceTag: z.string().max(200).nullable().default(null),
  accession: z.string().regex(/^\d{10}-\d{2}-\d{6}$/).nullable().default(null),
  conceptPriority: z.number().int().min(0).max(20).default(0),
  semantics: z.string().min(1).max(80).default('reported'),
  documentUrl: httpsUrl,
  provenance: provenanceSchema,
}).superRefine((fact, context) => {
  if ((fact.periodType === 'instant') !== (fact.periodStart === null)) {
    context.addIssue({ code: 'custom', message: 'Periodo y tipo de hecho incompatibles.' })
  }
  if (fact.periodStart && fact.periodStart > fact.periodEnd) {
    context.addIssue({ code: 'custom', message: 'Periodo contable invertido.' })
  }
  if (!fact.filedAt && !fact.filedDate || fact.filedAt && fact.filedDate &&
      fact.filedAt.slice(0, 10) !== fact.filedDate ||
      (fact.filedDate ?? fact.filedAt?.slice(0, 10) ?? '') < fact.periodEnd) {
    context.addIssue({ code: 'custom', message: 'Fecha de presentación ausente o incompatible.' })
  }
})

export const metricSchema = z.object({
  id: z.string().regex(/^M\d{2}$/),
  value: decimal.nullable(),
  unit: z.string().min(1).max(32),
  formulaVersion: z.string().min(1).max(40),
  inputs: z.array(z.object({ name: z.string().min(1).max(80), value: decimal,
    unit: z.string().min(1).max(32), companyId: stableId, listingId: stableId.nullable(),
    periodStart: civilDate.nullable(), periodEnd: civilDate.nullable(),
    provenance: z.array(provenanceSchema).min(1).max(32) })).max(20),
  periodStart: civilDate.nullable(),
  periodEnd: civilDate.nullable(),
  status: z.enum(['available', 'unavailable', 'not_applicable', 'stale', 'error']),
  explanation: z.string().min(1).max(500),
  reasonCode: z.string().min(1).max(80).nullable(),
}).superRefine((metric, context) => {
  if ((metric.status === 'available' || metric.status === 'stale') !== (metric.value !== null)) {
    context.addIssue({ code: 'custom', message: 'Estado y valor de métrica incompatibles.' })
  }
  if (metric.status !== 'available' && !metric.reasonCode) {
    context.addIssue({ code: 'custom', message: 'Falta motivo de la métrica.' })
  }
})

export type Quote = z.infer<typeof quoteSchema>
export type PriceHistory = z.infer<typeof historySchema>
export type PriceBar = z.infer<typeof priceBarSchema>
export type FinancialFact = z.infer<typeof financialFactSchema>
export type Metric = z.infer<typeof metricSchema>
