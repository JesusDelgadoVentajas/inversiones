import { z } from 'zod'
import { civilDate, httpsUrl, utcInstant } from './primitives.js'

export const dataStatus = z.enum([
  'available', 'partial', 'unavailable', 'not_applicable', 'stale', 'rate_limited', 'error',
])

export const provenanceSchema = z.object({
  provider: z.string().min(1).max(80),
  sourceUrl: httpsUrl.nullable(),
  retrievedAt: utcInstant,
  checkedAt: utcInstant,
  observedAt: utcInstant.nullable(),
  publishedAt: utcInstant.nullable(),
  periodStart: civilDate.nullable(),
  periodEnd: civilDate.nullable(),
  delaySeconds: z.number().int().nonnegative().nullable(),
  feed: z.string().min(1).max(80).nullable(),
  methodologyVersion: z.string().min(1).max(40),
}).refine((value) => !value.periodStart || !value.periodEnd || value.periodStart <= value.periodEnd, {
  message: 'Periodo invertido.',
})

export function dataBlockSchema<T extends z.ZodType>(data: T) {
  return z.object({
    status: dataStatus,
    data: z.unknown(),
    provenance: z.array(provenanceSchema).max(20),
    servedAt: utcInstant,
    fromCache: z.boolean(),
    cacheAgeSeconds: z.number().int().nonnegative().nullable(),
    nextAllowedRefreshAt: utcInstant.nullable(),
    warnings: z.array(z.string().min(1).max(240)).max(20),
    reasonCode: z.string().regex(/^[A-Z][A-Z0-9_]{1,79}$/).nullable(),
    requestId: z.uuid(),
  }).superRefine((value, context) => {
    const hasData = ['available', 'partial', 'stale'].includes(value.status)
    if (hasData !== (value.data !== null)) {
      context.addIssue({ code: 'custom', message: 'Estado y dato incompatibles.' })
    }
    if (hasData && value.provenance.length === 0) {
      context.addIssue({ code: 'custom', message: 'Falta procedencia para el dato.' })
    }
    if (value.fromCache !== (value.cacheAgeSeconds !== null)) {
      context.addIssue({ code: 'custom', message: 'Edad de caché incoherente.' })
    }
    if (value.status !== 'available' && !value.reasonCode) {
      context.addIssue({ code: 'custom', message: 'Falta motivo del estado.' })
    }
  }).transform((value, context) => {
    const parsed = data.nullable().safeParse(value.data)
    if (!parsed.success) {
      context.addIssue({ code: 'custom', message: 'Dato incompatible con el contrato.' })
      return z.NEVER
    }
    return { ...value, data: parsed.data }
  })
}

export type DataStatus = z.infer<typeof dataStatus>
export type Provenance = z.infer<typeof provenanceSchema>
export type DataBlock<T> = {
  status: DataStatus
  data: T | null
  provenance: Provenance[]
  servedAt: string
  fromCache: boolean
  cacheAgeSeconds: number | null
  nextAllowedRefreshAt: string | null
  warnings: string[]
  reasonCode: string | null
  requestId: string
}
