import { z } from 'zod'
import { currency, httpsUrl, stableId } from './primitives.js'

export const companySchema = z.object({
  id: stableId,
  legalName: z.string().trim().min(1).max(240),
  aliases: z.array(z.string().trim().min(1).max(240)).max(30),
  country: z.string().regex(/^[A-Z]{2}$/).nullable(),
  sector: z.string().trim().min(1).max(120).nullable(),
  website: httpsUrl.nullable(),
  identifiers: z.record(z.string().min(1).max(40), z.string().min(1).max(120)),
})

export const listingSchema = z.object({
  id: stableId,
  companyId: stableId,
  symbol: z.string().trim().min(1).max(40),
  mic: z.string().regex(/^[A-Z0-9]{4}$/),
  currency,
  instrument: z.enum(['ordinary', 'preferred', 'adr', 'gdr', 'fund', 'other']),
  shareClass: z.string().trim().min(1).max(60).nullable(),
  status: z.enum(['active', 'suspended', 'delisted', 'unknown']),
  timeZone: z.string().min(1).max(80).nullable(),
})

export const providerMappingSchema = z.object({
  id: stableId,
  provider: z.string().regex(/^[a-z][a-z0-9_-]{1,39}$/),
  companyId: stableId.nullable(),
  listingId: stableId.nullable(),
  externalId: z.string().min(1).max(180),
  verifiedAt: z.iso.datetime({ offset: false }).nullable(),
}).refine((value) => (value.companyId === null) !== (value.listingId === null), {
  message: 'El mapeo pertenece a una empresa o a un instrumento, no a ambos.',
})

export type Company = z.infer<typeof companySchema>
export type Listing = z.infer<typeof listingSchema>
export type ProviderMapping = z.infer<typeof providerMappingSchema>
