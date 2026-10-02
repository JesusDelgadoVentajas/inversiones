import { z } from 'zod'
import { provenanceSchema } from './blocks.js'
import { civilDate, decimal, httpsUrl, monetaryUnit, nonNegativeDecimal, stableId, utcInstant } from './primitives.js'

function compareUnsignedDecimal(left: string, right: string): number {
  const scaled = (value: string) => {
    const [integer, fraction = ''] = value.split('.')
    return BigInt(integer + fraction.padEnd(12, '0'))
  }
  const a = scaled(left)
  const b = scaled(right)
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
})

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
  if (bar.startsAt >= bar.endsAt) {
    context.addIssue({ code: 'custom', message: 'Intervalo de precio invertido.' })
  }
  if (bar.high && bar.low && compareUnsignedDecimal(bar.high, bar.low) < 0) {
    context.addIssue({ code: 'custom', message: 'Máximo menor que mínimo.' })
  }
  if (bar.high && compareUnsignedDecimal(bar.close, bar.high) > 0 ||
      bar.low && compareUnsignedDecimal(bar.close, bar.low) < 0) {
    context.addIssue({ code: 'custom', message: 'Cierre fuera del rango.' })
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
  filedAt: utcInstant,
  documentUrl: httpsUrl,
  provenance: provenanceSchema,
}).superRefine((fact, context) => {
  if ((fact.periodType === 'instant') !== (fact.periodStart === null)) {
    context.addIssue({ code: 'custom', message: 'Periodo y tipo de hecho incompatibles.' })
  }
  if (fact.periodStart && fact.periodStart > fact.periodEnd) {
    context.addIssue({ code: 'custom', message: 'Periodo contable invertido.' })
  }
})

export const metricSchema = z.object({
  id: z.string().regex(/^M\d{2}$/),
  value: decimal.nullable(),
  unit: z.string().min(1).max(32),
  formulaVersion: z.string().min(1).max(40),
  inputs: z.array(z.object({ name: z.string().min(1).max(80), value: decimal,
    provenance: z.array(provenanceSchema).min(1).max(10) })).max(20),
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
export type PriceBar = z.infer<typeof priceBarSchema>
export type FinancialFact = z.infer<typeof financialFactSchema>
export type Metric = z.infer<typeof metricSchema>
