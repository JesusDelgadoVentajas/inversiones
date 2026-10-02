import { describe, expect, it } from 'vitest'
import { normalizeSecFilings } from '../../worker/normalization/sec-news.js'
import { candidate } from '../fixtures/market.js'

const company = { ...candidate().company, identifiers: { cik: '0000000123' } }
const body = { cik: '123', filings: { recent: { accessionNumber: ['0000000123-26-000001'],
  filingDate: ['2026-09-20'], acceptanceDateTime: ['2026-09-20T12:00:00'],
  form: ['10-Q'], primaryDocument: ['synthetic.htm'] } } }
describe('publicaciones regulatorias SEC sin noticia inventada', () => {
  it('vincula CIK, usa documento seguro y preserva fecha cuando falta zona', async () => {
    const first = await normalizeSecFilings(body, company)
    expect(first[0]).toMatchObject({ kind: 'regulatory', publishedAt: null, publishedDate: '2026-09-20',
      companyIds: [company.id], source: 'SEC EDGAR' })
    expect(first[0].url).toBe('https://www.sec.gov/Archives/edgar/data/123/000000012326000001/synthetic.htm')
    expect((await normalizeSecFilings(body, company))[0].id).toBe(first[0].id)
  })
  it('no convierte recepción UTC de EDGAR en hora de publicación', async () => {
    const result = await normalizeSecFilings({ ...body, filings: { recent: { ...body.filings.recent,
      acceptanceDateTime: ['2026-09-21T00:30:00Z'] } } }, company)
    expect(result[0]).toMatchObject({ dateKind: 'filing', publishedAt: null, publishedDate: '2026-09-20' })
  })
  it('rechaza otro emisor, columnas desalineadas y documentos con recorrido de ruta', async () => {
    await expect(normalizeSecFilings({ ...body, cik: 124 }, company)).rejects.toThrow()
    await expect(normalizeSecFilings({ ...body, filings: { recent: { ...body.filings.recent, form: [] } } }, company)).rejects.toThrow()
    await expect(normalizeSecFilings({ ...body, filings: { recent: { ...body.filings.recent,
      primaryDocument: ['../private.htm'] } } }, company)).rejects.toThrow('SEC_DOCUMENT_INVALID')
  })
})
