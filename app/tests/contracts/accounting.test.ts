import { describe, expect, it } from 'vitest'
import { CalculationUnavailable, selectedFacts, trailingValue } from '../../shared/finance/accounting.js'
import { normalizeSecConcept } from '../../worker/normalization/sec-concepts.js'
import { fact } from '../fixtures/research.js'
import { companyId } from '../fixtures/contracts.js'

const asOf = '2026-10-02T12:00:00Z'
describe('periodos contables y versiones', () => {
  it('resta acumulados y forma cuatro trimestres contiguos, sin sumar YTD repetidamente', () => {
    const rows = [
      fact('revenue', '100', { periodEnd: '2025-03-31' }),
      fact('revenue', '250', { periodEnd: '2025-06-30' }),
      fact('revenue', '450', { periodEnd: '2025-09-30' }), fact('revenue', '700'),
      fact('revenue', '150', { periodStart: '2026-01-01', periodEnd: '2026-03-31', filedDate: '2026-05-01' }),
    ]
    const value = trailingValue(selectedFacts(rows, asOf), 'revenue')
    expect(value.value).toBe('750') // 150 + (250−100) + (450−250) + (700−450).
    expect(value.start).toBe('2025-04-01')
    expect(value.end).toBe('2026-03-31')
    expect(value.facts).toHaveLength(5)
    expect(() => trailingValue(rows.filter((row) => row.periodEnd !== '2025-09-30'), 'revenue'))
      .toThrow('INCOMPLETE_TTM')
  })
  it('admite ejercicios de 53 semanas y rechaza sumar EPS', () => {
    expect(trailingValue([fact('revenue', '52', { periodStart: '2024-12-29', periodEnd: '2026-01-03' })],
      'revenue').value).toBe('52')
    expect(() => trailingValue([fact('eps_diluted', '1', { periodEnd: '2025-03-31' })], 'eps_diluted'))
      .toThrow('ADDITIVE_DERIVATION_FORBIDDEN')
  })
  it('respeta el conocimiento disponible, sin inventar hora para una fecha civil', () => {
    const original = fact('revenue', '10')
    const revised = fact('revenue', '12', { filedDate: '2026-03-01' })
    expect(selectedFacts([original, revised], '2026-03-01T23:59:59Z')[0].value).toBe('10')
    expect(selectedFacts([original, revised], '2026-03-02T00:00:00Z')[0].value).toBe('12')
    expect(() => selectedFacts([original, fact('revenue', '11')], asOf)).toThrow('AMBIGUOUS_REVISION')
    expect(selectedFacts([original, fact('revenue', '10.0', { conceptPriority: 1 })], asOf)[0].value).toBe('10')
    expect(() => selectedFacts([original, fact('revenue', '11', { conceptPriority: 1 })], asOf)).toThrow('AMBIGUOUS_CONCEPT')
  })
  it('acota respuestas con demasiadas variantes', () => {
    const rows = Array.from({ length: 121 }, () => fact('revenue', '10'))
    expect(() => trailingValue(rows, 'revenue')).toThrow(CalculationUnavailable)
  })
})

describe('límite de entrada SEC sintético', () => {
  const options = { companyId, cik: '0000000123', tag: 'NetIncomeLoss', retrievedAt: asOf }
  const row = { val: 0, start: '2025-01-01', end: '2025-12-31', filed: '2026-02-01',
    accn: '0000000123-26-000001', form: '10-K' }
  const body = { cik: 123, taxonomy: 'us-gaap', tag: 'NetIncomeLoss', units: { GBP: [row] } }
  it('preserva cero, fecha sin hora, matriz, unidad y documento', () => {
    const normalized = normalizeSecConcept(body, options)
    expect(normalized.rejected).toBe(0)
    expect(normalized.facts[0]).toMatchObject({ value: '0', filedDate: '2026-02-01',
      filedAt: null, attribution: 'parent', sourceScale: 0, unit: 'GBP' })
    expect(normalized.facts[0].documentUrl).toContain('000000012326000001')
  })
  it('rechaza identidad, taxonomía y conceptos no mapeados; no adivina IFRS', () => {
    expect(() => normalizeSecConcept({ ...body, cik: 124 }, options)).toThrow()
    expect(() => normalizeSecConcept({ ...body, taxonomy: 'ifrs-full' }, options)).toThrow()
    expect(() => normalizeSecConcept(body, { ...options, tag: 'ProfitLoss' })).toThrow()
  })
  it('rechaza precisión insegura, fecha invertida y unidades no verificadas', () => {
    const result = normalizeSecConcept({ ...body, units: { GBP: [
      { ...row, val: 9007199254740992 }, { ...row, filed: '2025-01-01' },
    ], mystery: [row] } }, options)
    expect(result).toEqual({ facts: [], rejected: 3 })
    expect(normalizeSecConcept({ ...body, units: { GBP: [{ ...row, val: 1e-7 }] } }, options)
      .facts[0].value).toBe('0.0000001')
  })
})
