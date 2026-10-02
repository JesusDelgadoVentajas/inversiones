import { z } from 'zod'
import { companySchema } from '../../shared/contracts/identity.js'
import type { Company } from '../../shared/contracts/identity.js'
import { newsItemSchema } from '../../shared/contracts/context.js'
import { civilDate, stableId } from '../../shared/contracts/primitives.js'

const columns = z.object({
  accessionNumber: z.array(z.string().regex(/^\d{10}-\d{2}-\d{6}$/)).max(2000),
  filingDate: z.array(civilDate).max(2000),
  acceptanceDateTime: z.array(z.string().max(80)).max(2000).optional(),
  form: z.array(z.string().min(1).max(20)).max(2000),
  primaryDocument: z.array(z.string().min(1).max(240)).max(2000),
}).refine((value) => [value.filingDate, value.form, value.primaryDocument,
  ...value.acceptanceDateTime ? [value.acceptanceDateTime] : []].every((column) =>
  column.length === value.accessionNumber.length), { message: 'Columnas SEC desalineadas.' })
const submissions = z.object({ cik: z.union([z.number().int().positive(), z.string().regex(/^\d{1,10}$/)]),
  filings: z.object({ recent: columns }) })
const forms = new Set(['10-K', '10-Q', '8-K', '20-F', '6-K', 'DEF 14A',
  '10-K/A', '10-Q/A', '8-K/A', '20-F/A', '6-K/A'])

async function articleId(companyId: string, accession: string): Promise<string> {
  // UUID v8 determinista: hash SHA-256 truncado con bits de versión/variante.
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode('sec-filing|' + companyId + '|' + accession))).slice(0, 16)
  bytes[6] = bytes[6] & 0x0f | 0x80
  bytes[8] = bytes[8] & 0x3f | 0x80
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return stableId.parse([hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16),
    hex.slice(16, 20), hex.slice(20)].join('-'))
}

export async function normalizeSecFilings(input: unknown, company: Company) {
  company = companySchema.parse(company)
  const data = submissions.parse(input)
  const cik = String(data.cik).padStart(10, '0')
  if (!/^\d{10}$/.test(company.identifiers.cik ?? '') || cik !== company.identifiers.cik) {
    throw new Error('SEC_ISSUER_INVALID')
  }
  const rows = data.filings.recent
  const eligible = rows.accessionNumber.map((accession, index) => ({ accession, index }))
    .filter(({ index }) => forms.has(rows.form[index]))
    .sort((a, b) => rows.filingDate[b.index].localeCompare(rows.filingDate[a.index]))
    .slice(0, 20)
  return Promise.all(eligible.map(async ({ accession, index }) => {
    const filename = rows.primaryDocument[index]
    if (!/^[A-Za-z0-9_.-]+\.htm(?:l)?$/.test(filename) || filename.includes('..')) {
      throw new Error('SEC_DOCUMENT_INVALID')
    }
    // Recepción por EDGAR no demuestra cuándo se hizo público el documento.
    return newsItemSchema.parse({
      id: await articleId(company.id, accession), title: 'Presentación ' + rows.form[index] + ' de ' + company.legalName,
      url: 'https://www.sec.gov/Archives/edgar/data/' + Number(cik) + '/' +
        accession.replaceAll('-', '') + '/' + filename,
      source: 'SEC EDGAR', kind: 'regulatory', language: 'und', relationKind: 'verified_issuer',
      companyIds: [company.id], relationReason: 'Presentación del emisor identificado por la SEC con CIK ' + cik + '.',
      dateKind: 'filing', publishedAt: null, publishedDate: rows.filingDate[index],
    })
  }))
}
