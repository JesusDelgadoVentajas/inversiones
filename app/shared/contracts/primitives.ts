import { z } from 'zod'

export const stableId = z.uuid()
export const decimal = z.string().regex(/^-?(?:0|[1-9]\d{0,29})(?:\.\d{1,12})?$/)
export const nonNegativeDecimal = decimal.refine((value) => !value.startsWith('-'))
export const currency = z.string().regex(/^[A-Z]{3}$/)
export const utcInstant = z.iso.datetime({ offset: false }).refine(
  (value) => !Number.isNaN(Date.parse(value)),
)
export const civilDate = z.iso.date()
export const httpsUrl = z.url().refine((value) => {
  const url = new URL(value)
  return url.protocol === 'https:' && !url.username && !url.password
})

// Todos los importes se transportan como decimales exactos. La conversión a number
// queda reservada a cálculos que hayan comprobado magnitud y precisión.
export const monetaryUnit = z.object({
  currency,
  unit: z.string().min(1).max(16),
  unitToMajor: nonNegativeDecimal.refine((value) => !/^0(?:\.0+)?$/.test(value)),
})

export type StableId = z.infer<typeof stableId>
export type Decimal = z.infer<typeof decimal>
