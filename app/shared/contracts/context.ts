import { z } from 'zod'
import { civilDate, httpsUrl, stableId, utcInstant } from './primitives.js'

export const newsItemSchema = z.object({
  id: stableId,
  title: z.string().trim().min(1).max(300),
  url: httpsUrl,
  source: z.string().min(1).max(120),
  publishedAt: utcInstant.nullable().default(null),
  publishedDate: civilDate.nullable().default(null),
  dateKind: z.enum(['publication', 'filing']).default('publication'),
  language: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).default('und'),
  kind: z.enum(['corporate', 'independent', 'regulatory', 'sector', 'macro']),
  relationKind: z.enum(['verified_issuer', 'verified_provider', 'explicit_reference']),
  companyIds: z.array(stableId).min(1).max(20),
  relationReason: z.string().min(1).max(240),
}).refine((item) => (item.publishedAt !== null || item.publishedDate !== null) &&
  (!item.publishedAt || !item.publishedDate || item.publishedAt.slice(0, 10) === item.publishedDate), {
  message: 'Fecha original de publicación ausente o incompatible.',
})

export const newsPageSchema = z.object({
  items: z.array(newsItemSchema).max(20),
  nextCursor: z.string().regex(/^[A-Za-z0-9_-]{1,700}$/).nullable(),
  snapshotAt: utcInstant,
})
export const newsKindSchema = z.enum(['all', 'corporate', 'independent', 'regulatory', 'sector', 'macro'])
export type NewsPage = z.infer<typeof newsPageSchema>

export const eventSchema = z.object({
  id: stableId,
  type: z.enum(['earnings', 'dividend', 'split', 'meeting', 'macro', 'other']),
  companyId: stableId.nullable(),
  listingId: stableId.nullable(),
  region: z.string().regex(/^[A-Z]{2}$/).nullable(),
  startsAt: utcInstant.nullable(),
  date: civilDate,
  precision: z.enum(['exact_time', 'date_only', 'estimated']),
  timeZone: z.string().min(1).max(80).nullable(),
  status: z.enum(['confirmed', 'estimated', 'cancelled', 'unknown']),
  sourceUrl: httpsUrl,
}).refine((event) => event.companyId !== null || event.region !== null, {
  message: 'El evento requiere empresa o región.',
}).refine((event) => event.precision !== 'exact_time' || (event.startsAt !== null &&
  event.timeZone !== null), { message: 'La hora exacta requiere instante y zona.' })

export const peerSchema = z.object({
  companyId: stableId,
  listingId: stableId.nullable(),
  selection: z.enum(['provider', 'industry', 'user']),
  reason: z.string().min(1).max(300),
  checkedAt: utcInstant,
})

export const capabilitySchema = z.object({
  provider: z.string().min(1).max(80),
  market: z.string().min(1).max(40),
  block: z.enum(['search', 'quote', 'history', 'financials', 'news', 'events', 'peers']),
  plan: z.string().min(1).max(80),
  licenseStatus: z.enum(['pending', 'personal_allowed', 'blocked']),
  limitDescription: z.string().min(1).max(300),
  testedAt: utcInstant.nullable(),
  environment: z.enum(['local', 'staging', 'production']).nullable(),
})

export const preferenceSchema = z.object({
  ownerId: stableId,
  version: z.number().int().nonnegative(),
  timeZone: z.string().min(1).max(80),
  theme: z.enum(['system', 'light', 'dark']),
  favoriteListingIds: z.array(stableId).max(100),
})

export type NewsItem = z.infer<typeof newsItemSchema>
export type Event = z.infer<typeof eventSchema>
export type Peer = z.infer<typeof peerSchema>
export type Capability = z.infer<typeof capabilitySchema>
export type Preference = z.infer<typeof preferenceSchema>
