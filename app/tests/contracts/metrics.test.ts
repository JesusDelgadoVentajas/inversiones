import { describe, expect, it } from 'vitest'
import { calculateMetrics } from '../../shared/finance/metrics.js'
import { candidate, history } from '../fixtures/market.js'
import { financials, fact } from '../fixtures/research.js'
import { quoteBlock, provenance } from '../fixtures/contracts.js'

const identity = candidate()
const options = { company: identity.company, listing: identity.listings[0], facts: financials,
  asOf: '2026-10-02T12:00:00Z', quote: { ...quoteBlock, data: { ...quoteBlock.data!,
    price: '20', sessionVolume: '1000', unit: { currency: 'GBP', unit: 'GBP', unitToMajor: '1' },
    capitalization: { companyId: identity.company.id, value: '800', currency: 'GBP',
      scope: 'all_common_classes' as const, observedAt: quoteBlock.data!.observedAt, provenance } } } }
const metric = (id: string, changes: Partial<Parameters<typeof calculateMetrics>[0]> = {}) =>
  calculateMetrics({ ...options, ...changes }).find((entry) => entry.id === id)!

describe('catálogo de métricas con oráculos aritméticos independientes', () => {
  it('calcula importes, ratios y porcentajes con precisión explícita', () => {
    // Resultados fijados con operaciones independientes, no obtenidos del motor.
    const expected = { M03: '800', M04: '1000', M07: '400', M08: '25', M09: '40', M10: '100',
      M11: '2', M12: '40', M13: '20', M14: '10', M15: '100', M16: '70', M17: '-30', M18: '140',
      M19: '60', M20: '100', M21: '-40', M22: '-10', M23: '10', M24: '2', M25: '8',
      M26: '-5', M27: '33.333333', M28: '2', M29: '0.5', M32: '25' }
    const metrics = calculateMetrics(options)
    expect(metrics).toHaveLength(32)
    for (const [id, value] of Object.entries(expected)) {
      expect(metrics.find((entry) => entry.id === id), id).toMatchObject({ value, status: 'available' })
    }
    expect(metric('M21').inputs[0].provenance).not.toHaveLength(0)
  })
  it('convierte peniques a libras y exige base por acción para PER', () => {
    expect(metric('M23', { quote: { ...options.quote, data: { ...options.quote.data,
      unit: { currency: 'GBP', unit: 'GBX', unitToMajor: '0.01' } } } }).value).toBe('0.1')
    const rows = financials.map((row) => row.concept === 'eps_diluted' ? { ...row, shareBasis: 'unknown' as const } : row)
    expect(metric('M23', { facts: rows })).toMatchObject({ value: null, reasonCode: 'SHARE_BASIS_UNVERIFIED' })
    expect(metric('M23', { listing: { ...options.listing, instrument: 'adr' } }))
      .toMatchObject({ value: null, reasonCode: 'SHARE_BASIS_UNVERIFIED' })
  })
  it('distingue pérdidas, bases negativas, patrimonio inválido y sectores', () => {
    const rows = financials.map((row) => row.concept === 'net_income' && row.periodEnd === '2024-12-31'
      ? { ...row, value: '-20' } : row)
    expect(metric('M10', { facts: rows })).toMatchObject({ value: null, reasonCode: 'NON_POSITIVE_BASE' })
    expect(metric('M10', { facts: rows }).explanation).toContain('Cambio absoluto: 60 GBP')
    expect(metric('M27', { facts: financials.map((row) => row.concept === 'equity' ? { ...row, value: '-1' } : row) }).value).toBeNull()
    expect(metric('M28', { company: { ...options.company, sector: 'Banking' } }).status).toBe('not_applicable')
  })
  it('no mezcla divisas, periodos, atribuciones ni ausencias con ceros', () => {
    expect(metric('M12', { facts: financials.map((row) => row.concept === 'gross_profit' ? { ...row, unit: 'USD' } : row) }).value).toBeNull()
    expect(metric('M21', { facts: financials.filter((row) => row.concept !== 'capex') }).value).toBeNull()
    expect(metric('M20', { facts: [fact('capex', '-100')] }).reasonCode).toBe('CAPEX_SIGN_INVALID')
    expect(metric('M18', { facts: [fact('equity', '100', { attribution: 'issuer' })] }).value).toBeNull()
    expect(metric('M07', { facts: [fact('revenue', '0')] }).value).toBe('0')
    expect(metric('M12', { facts: [fact('revenue', '0'), fact('gross_profit', '0')] }).value).toBeNull()
    expect(metric('M24', { quote: { ...options.quote, data: { ...options.quote.data,
      capitalization: { ...options.quote.data.capitalization, observedAt: '2025-10-02T09:59:00Z' } } } }).value).toBeNull()
  })
  it('mantiene antigüedad, revisiones y trazabilidad por entrada', () => {
    expect(metric('M21', { factsStale: true })).toMatchObject({ status: 'stale', value: '-40' })
    expect(metric('M07', { facts: [...financials, fact('revenue', '401')] }))
      .toMatchObject({ value: null, reasonCode: 'AMBIGUOUS_REVISION' })
    expect(metric('M23').inputs[0]).toMatchObject({ listingId: options.listing.id,
      unit: 'GBP', provenance: quoteBlock.provenance })
    expect(metric('M30').value).toBeNull()
  })
  it('acepta dividendo anual solo en la ventana y base por acción verificadas', () => {
    const dividend = fact('dividend_per_share', '1.2', { unit: 'GBP/shares', listingId: options.listing.id,
      shareBasis: 'verified_current', periodStart: '2025-10-03', periodEnd: '2026-10-02',
      filedDate: '2026-10-02', filedAt: '2026-10-02T10:00:00Z' })
    expect(metric('M30', { facts: [dividend] }).value).toBe('1.2')
    expect(metric('M31', { facts: [dividend] }).value).toBe('6')
    expect(metric('M30', { facts: [{ ...dividend, periodEnd: '2026-09-30' }] }).value).toBeNull()
  })
  it('usa histórico anual homogéneo sin exigir una cotización ni inventar extremos', () => {
    const full = { ...history, coverage: 'complete' as const, bars: history.bars.map((bar, index) => ({ ...bar,
      startsAt: index === 0 ? '2025-10-01T08:00:00Z' : '2026-09-30T08:00:00Z',
      endsAt: index === 0 ? '2025-10-01T16:30:00Z' : '2026-09-30T16:30:00Z',
      close: index === 0 ? '100' : '120', high: index === 0 ? '110' : '130', low: '90' })) }
    // La declaración de cobertura es sintética. La fuente real deberá verificar
    // su calendario; un año entre extremos por sí solo no acredita cobertura.
    const input = { ...options, quote: null, history: { ...quoteBlock, data: full } }
    const metrics = calculateMetrics(input)
    expect(metrics.find((entry) => entry.id === 'M02')?.value).toBe('20')
    expect(metrics.find((entry) => entry.id === 'M05')?.value).toBe('1.3')
    expect(metric('M05', { history: { ...quoteBlock, data: { ...full, coverage: 'unknown' } } }).value).toBeNull()
    expect(metric('M05', { history: { ...quoteBlock, data: history } }).value).toBeNull()
  })
})
