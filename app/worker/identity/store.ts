import { companySchema, listingSchema } from '../../shared/contracts/identity.js'
import type { Company } from '../../shared/contracts/identity.js'
import { profileSchema, verifiedCandidateSchema } from '../../shared/contracts/search.js'
import type { Profile, VerifiedCandidate } from '../../shared/contracts/search.js'

interface MappingRow { id: string; provider: string; external_id: string; company_id: string | null; listing_id: string | null }

export async function saveIdentity(db: D1Database, input: VerifiedCandidate, provider: string): Promise<void> {
  const candidate = verifiedCandidateSchema.parse(input)
  if (candidate.mappings.some((mapping) => mapping.provider !== provider)) throw new Error('IDENTITY_CONFLICT')
  const statements: D1PreparedStatement[] = []
  statements.push(db.prepare(`INSERT INTO companies
    (id,legal_name,aliases_json,country,sector,website,identifiers_json,created_at)
    VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
    legal_name=excluded.legal_name,aliases_json=excluded.aliases_json,country=excluded.country,
    sector=excluded.sector,website=excluded.website,identifiers_json=excluded.identifiers_json`)
    .bind(candidate.company.id, candidate.company.legalName, JSON.stringify(candidate.company.aliases),
      candidate.company.country, candidate.company.sector, candidate.company.website,
      JSON.stringify(candidate.company.identifiers), new Date().toISOString()))
  for (const listing of candidate.listings) {
    const previous = await db.prepare('SELECT * FROM listings WHERE id=?').bind(listing.id)
      .first<{ company_id: string; symbol: string; mic: string; currency: string; instrument: string; share_class: string }>()
    if (previous && (previous.company_id !== listing.companyId || previous.symbol !== listing.symbol ||
      previous.mic !== listing.mic || previous.currency !== listing.currency || previous.instrument !== listing.instrument ||
      previous.share_class !== (listing.shareClass ?? ''))) throw new Error('IDENTITY_CONFLICT')
    statements.push(db.prepare(`INSERT INTO listings
      (id,company_id,symbol,mic,currency,instrument,share_class,status,time_zone)
      VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      company_id=excluded.company_id,symbol=excluded.symbol,mic=excluded.mic,
      currency=excluded.currency,instrument=excluded.instrument,share_class=excluded.share_class,
      status=excluded.status,time_zone=excluded.time_zone`)
      .bind(listing.id, listing.companyId, listing.symbol, listing.mic, listing.currency,
        listing.instrument, listing.shareClass ?? '', listing.status, listing.timeZone))
  }
  for (const mapping of candidate.mappings) {
    const known = await db.prepare('SELECT * FROM provider_mappings WHERE provider=? AND external_id=?')
      .bind(provider, mapping.externalId).first<MappingRow>()
    const id = known?.id ?? mapping.id
    const byId = await db.prepare('SELECT * FROM provider_mappings WHERE id=?').bind(id).first<MappingRow>()
    if ([known, byId].some((row) => row && (row.provider !== provider || row.external_id !== mapping.externalId ||
      row.company_id !== mapping.companyId || row.listing_id !== mapping.listingId))) throw new Error('IDENTITY_CONFLICT')
    statements.push(db.prepare(`INSERT INTO provider_mappings(id,provider,company_id,listing_id,external_id,verified_at)
      VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET provider=excluded.provider,
      company_id=excluded.company_id,listing_id=excluded.listing_id,external_id=excluded.external_id,
      verified_at=excluded.verified_at`)
      .bind(id, provider, mapping.companyId, mapping.listingId, mapping.externalId, mapping.verifiedAt))
  }
  // batch es transaccional: un conflicto de unicidad revierte toda esta identidad.
  await db.batch(statements)
}

export async function readProfile(db: D1Database, listingId: string): Promise<Profile | null> {
  const listing = await db.prepare('SELECT * FROM listings WHERE id=?').bind(listingId).first<{
    id: string; company_id: string; symbol: string; mic: string; currency: string;
    instrument: string; share_class: string; status: string; time_zone: string | null
  }>()
  if (!listing) return null
  const company = await readCompany(db, listing.company_id)
  if (!company) throw new Error('IDENTITY_INVALID')
  const mappings = await db.prepare(`SELECT provider,verified_at FROM provider_mappings
    WHERE listing_id=? AND verified_at IS NOT NULL`).bind(listingId)
    .all<{ provider: string; verified_at: string }>()
  return profileSchema.parse({
    company,
    listing: listingSchema.parse({ id: listing.id, companyId: listing.company_id,
      symbol: listing.symbol, mic: listing.mic, currency: listing.currency,
      instrument: listing.instrument, shareClass: listing.share_class || null,
      status: listing.status, timeZone: listing.time_zone }),
    sources: mappings.results.map((mapping) => ({ provider: mapping.provider, verifiedAt: mapping.verified_at })),
  })
}

export async function readCompany(db: D1Database, id: string): Promise<Company | null> {
  const company = await db.prepare('SELECT * FROM companies WHERE id=?').bind(id).first<{
    id: string; legal_name: string; aliases_json: string; country: string | null;
    sector: string | null; website: string | null; identifiers_json: string
  }>()
  if (!company) return null
  return companySchema.parse({ id: company.id, legalName: company.legal_name,
      aliases: JSON.parse(company.aliases_json), country: company.country, sector: company.sector,
      website: company.website, identifiers: JSON.parse(company.identifiers_json) })
}
