import { describe, expect, it } from 'vitest'
import { dataBlockSchema, provenanceSchema } from '../../shared/contracts/blocks.js'
import { companySchema, listingSchema, providerMappingSchema } from '../../shared/contracts/identity.js'
import { financialFactSchema, priceBarSchema, quoteSchema } from '../../shared/contracts/financial.js'
import { apiErrorSchema } from '../../shared/contracts/errors.js'
import { civilDate, decimal, utcInstant } from '../../shared/contracts/primitives.js'
import { companyId, listingId, provenance, quote, quoteBlock, requestId } from '../fixtures/contracts.js'

describe('contratos sintéticos y unidades', () => {
  it('conserva decimal exacto grande y separa penique de libra', () => {
    expect(decimal.parse('9007199254740993.25')).toBe('9007199254740993.25')
    expect(decimal.safeParse('9e15').success).toBe(false)
    expect(quoteSchema.parse(quote).unit).toEqual({ currency: 'GBP', unit: 'GBX', unitToMajor: '0.01' })
    expect(quoteSchema.safeParse({ ...quote, price: '0' }).success).toBe(false)
    expect(quoteSchema.safeParse({ ...quote, price: '' }).success).toBe(false)
  })

  it('distingue fecha civil válida e instante UTC', () => {
    expect(civilDate.safeParse('2024-02-29').success).toBe(true)
    expect(civilDate.safeParse('2025-02-29').success).toBe(false)
    expect(utcInstant.safeParse('2026-10-02T10:00:00Z').success).toBe(true)
    expect(utcInstant.safeParse('2026-10-02T10:00:00+02:00').success).toBe(false)
    expect(provenanceSchema.safeParse({ ...provenance, periodStart: '2026-10-03',
      periodEnd: '2026-10-02' }).success).toBe(false)
  })

  it('no confunde emisor, cotización ni mapeo de proveedor', () => {
    const company = { id: companyId, legalName: 'Empresa inventada', aliases: [],
      country: 'GB', sector: null, website: null, identifiers: {} }
    const listing = { id: listingId, companyId, symbol: 'EINV', mic: 'XLON', currency: 'GBP',
      instrument: 'ordinary', shareClass: null, status: 'active', timeZone: 'Europe/London' }
    expect(companySchema.safeParse(company).success).toBe(true)
    expect(listingSchema.safeParse(listing).success).toBe(true)
    const mapping = { id: crypto.randomUUID(), provider: 'synthetic', companyId,
      listingId: null, externalId: 'ID-1', verifiedAt: null }
    expect(providerMappingSchema.safeParse(mapping).success).toBe(true)
    expect(providerMappingSchema.safeParse({ ...mapping, listingId }).success).toBe(false)
  })

  it('requiere dato y procedencia coherentes con el estado', () => {
    const schema = dataBlockSchema(quoteSchema)
    expect(schema.safeParse(quoteBlock).success).toBe(true)
    expect(schema.safeParse({ ...quoteBlock, data: null }).success).toBe(false)
    expect(schema.safeParse({ ...quoteBlock, provenance: [] }).success).toBe(false)
    expect(schema.safeParse({ ...quoteBlock, fromCache: true }).success).toBe(false)
    expect(schema.safeParse({ ...quoteBlock, status: 'unavailable', data: null,
      provenance: [], reasonCode: 'NO_COVERAGE' }).success).toBe(true)
    expect(schema.safeParse({ ...quoteBlock, status: 'unavailable', data: null,
      provenance: [], reasonCode: null }).success).toBe(false)
  })

  it('separa balances instantáneos de flujos y exige documento', () => {
    const fact = { companyId, concept: 'revenue', value: '9007199254740993.25', unit: 'USD',
      sourceScale: 0, periodType: 'duration', periodStart: '2026-01-01',
      periodEnd: '2026-03-31', filedAt: '2026-04-30T12:00:00Z',
      documentUrl: 'https://example.org/filing', provenance }
    expect(financialFactSchema.safeParse(fact).success).toBe(true)
    expect(financialFactSchema.safeParse({ ...fact, periodStart: null }).success).toBe(false)
    expect(financialFactSchema.safeParse({ ...fact, documentUrl: 'http://example.org/filing' }).success).toBe(false)
  })

  it('rechaza barras con máximo y mínimo invertidos sin redondear importes grandes', () => {
    const bar = { listingId, startsAt: '2026-10-01T00:00:00Z', endsAt: '2026-10-02T00:00:00Z',
      resolution: 'day', open: '9007199254740993.20', high: '9007199254740993.30',
      low: '9007199254740993.10', close: '9007199254740993.25', volume: '100',
      unit: quote.unit, adjustment: 'raw', provenance }
    expect(priceBarSchema.safeParse(bar).success).toBe(true)
    expect(priceBarSchema.safeParse({ ...bar, high: '9007199254740993.05' }).success).toBe(false)
    expect(priceBarSchema.safeParse({ ...bar, close: '9007199254740993.31' }).success).toBe(false)
  })

  it('impide publicar un error sin identificador o con código arbitrario', () => {
    const error = { code: 'NOT_FOUND', message: 'Ruta no disponible.', requestId,
      at: '2026-10-02T10:00:00Z', retryable: false }
    expect(apiErrorSchema.safeParse(error).success).toBe(true)
    expect(apiErrorSchema.safeParse({ ...error, code: 'token=private' }).success).toBe(false)
    expect(apiErrorSchema.safeParse({ ...error, requestId: '' }).success).toBe(false)
  })
})
