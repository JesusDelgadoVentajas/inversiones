import { z } from 'zod'
import { companySchema, listingSchema, providerMappingSchema } from './identity.js'

export const searchQuerySchema = z.string().transform((value) => value.normalize('NFC').trim().replace(/\s+/gu, ' '))
  .refine((value) => Array.from(value).length >= 2 && Array.from(value).length <= 80 &&
    !/[\p{Cc}\p{Cf}]/u.test(value), 'Usa un nombre de 2–80 caracteres sin controles invisibles.')

export const searchCandidateSchema = z.object({
  company: companySchema,
  listings: listingSchema.array().min(1).max(20),
}).refine((candidate) => candidate.listings.every((listing) => listing.companyId === candidate.company.id),
  'Instrumento asociado a otro emisor.')

export const verifiedCandidateSchema = searchCandidateSchema.safeExtend({
  mappings: providerMappingSchema.array().min(2).max(21),
}).superRefine((candidate, context) => {
  const targets = [candidate.company.id, ...candidate.listings.map((listing) => listing.id)]
  if (candidate.mappings.length !== targets.length || candidate.mappings.some((mapping) =>
    mapping.verifiedAt === null || !targets.includes(mapping.companyId ?? mapping.listingId ?? '')) ||
    new Set(candidate.mappings.map((mapping) => mapping.companyId ?? mapping.listingId)).size !== targets.length) {
    context.addIssue({ code: 'custom', message: 'Falta un mapeo verificado por identidad.' })
  }
})

export const profileSchema = z.object({ company: companySchema, listing: listingSchema,
  sources: z.array(z.object({ provider: z.string(), verifiedAt: z.iso.datetime({ offset: false }) })).min(1),
}).refine((profile) => profile.company.id === profile.listing.companyId)

export type SearchCandidate = z.infer<typeof searchCandidateSchema>
export type VerifiedCandidate = z.infer<typeof verifiedCandidateSchema>
export type Profile = z.infer<typeof profileSchema>

export function rankCandidates(candidates: SearchCandidate[], query: string): SearchCandidate[] {
  const normalized = query.toLocaleLowerCase('es')
  const score = (candidate: SearchCandidate) => Math.max(...[
    candidate.company.legalName, ...candidate.company.aliases,
  ].map((name) => {
    const value = name.toLocaleLowerCase('es')
    return value === normalized ? 3 : value.startsWith(normalized) ? 2 : value.includes(normalized) ? 1 : 0
  }))
  return [...candidates].sort((a, b) => score(b) - score(a) ||
    a.company.legalName.localeCompare(b.company.legalName, 'es'))
}
