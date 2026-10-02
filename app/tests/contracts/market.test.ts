import { describe, expect, it } from 'vitest'
import { historySchema } from '../../shared/contracts/financial.js'
import { monetaryUnit } from '../../shared/contracts/primitives.js'
import { searchQuerySchema, verifiedCandidateSchema } from '../../shared/contracts/search.js'
import { priceChange } from '../../shared/finance/price-change.js'
import { candidate, history } from '../fixtures/market.js'
import { listingId, quote, provenance } from '../fixtures/contracts.js'

const previous = { listingId, price: '10', unit: quote.unit, observedAt: '2026-10-01T16:30:00Z',
  feed: 'test', adjustment: 'raw' as const, shareBasis: 'current_shares' as const, provenance }

describe('precios con cálculos independientes', () => {
  it('12,34 respecto a 10 sube 2,34 unidades y 23,4 %, sin convertir GBX en GBP', () => {
    expect(priceChange({ ...quote, previousClose: previous })).toEqual({
      available: true, absolute: '2.34', percent: '23.4',
    })
    expect(priceChange({ ...quote, price: '9', previousClose: previous })).toEqual({
      available: true, absolute: '-1', percent: '-10',
    })
  })
  it('mantiene doce decimales y redondea porcentajes a seis, también al bajar', () => {
    expect(priceChange({ ...quote, price: '1.000000000001', previousClose: { ...previous, price: '1' } }))
      .toEqual({ available: true, absolute: '0.000000000001', percent: '0' })
    expect(priceChange({ ...quote, price: '2', previousClose: { ...previous, price: '3' } }))
      .toEqual({ available: true, absolute: '-1', percent: '-33.333333' })
  })
  it('no calcula con moneda, instrumento, feed o base de acciones incompatible', () => {
    for (const changed of [
      { unit: { ...previous.unit, currency: 'USD' } }, { feed: 'another' },
      { listingId: crypto.randomUUID() }, { shareBasis: 'unknown' as const },
      { observedAt: quote.observedAt },
    ]) expect(priceChange({ ...quote, previousClose: { ...previous, ...changed } }))
      .toEqual({ available: false, reason: 'PREVIOUS_CLOSE_INCOMPATIBLE' })
    expect(priceChange(quote)).toEqual({ available: false, reason: 'PREVIOUS_CLOSE_MISSING' })
    expect(priceChange({ ...quote, previousClose: { ...previous, price: '0' } }))
      .toEqual({ available: false, reason: 'ZERO_BASE' })
  })
  it('un split 2:1 usa cierre de 50 en acciones actuales, evitando una caída falsa del 50 %', () => {
    expect(priceChange({ ...quote, price: '50', previousClose: { ...previous, price: '50', adjustment: 'split_adjusted' } }))
      .toEqual({ available: true, absolute: '0', percent: '0' })
    expect(priceChange({ ...quote, price: '50', previousClose: { ...previous, price: '100', shareBasis: 'unknown' } }))
      .toEqual({ available: false, reason: 'PREVIOUS_CLOSE_INCOMPATIBLE' })
  })
  it('los instantes se comparan como tiempo, incluso con fracciones de segundo', () => {
    expect(priceChange({ ...quote, observedAt: '2026-10-02T09:59:00.500Z', previousClose: {
      ...previous, observedAt: '2026-10-02T09:59:00Z',
    } })).toMatchObject({ available: true })
  })
})

describe('identidad e históricos', () => {
  it('acepta Unicode y 3M sin catálogo local; rechaza controles y longitudes incorrectas', () => {
    expect(searchQuerySchema.parse('  3M  ')).toBe('3M')
    expect(searchQuerySchema.parse('Cafe\u0301   Nuevo')).toBe('Café Nuevo')
    expect(searchQuerySchema.safeParse('A').success).toBe(false)
    expect(searchQuerySchema.safeParse('A'.repeat(81)).success).toBe(false)
    expect(searchQuerySchema.safeParse('Apple\u200b').success).toBe(false)
    expect(verifiedCandidateSchema.safeParse(candidate()).success).toBe(true)
    const invalid = candidate()
    invalid.mappings[0].verifiedAt = null
    expect(verifiedCandidateSchema.safeParse(invalid).success).toBe(false)
    expect(monetaryUnit.safeParse({ currency: 'GBP', unit: 'GBX', unitToMajor: '0.00' }).success).toBe(false)
  })
  it('mantiene el hueco de fin de semana y rechaza barras vacías, mezcladas, duplicadas o invertidas', () => {
    expect(historySchema.parse(history).bars).toHaveLength(2)
    for (const invalid of [
      { ...history, bars: [] },
      { ...history, bars: [history.bars[0], history.bars[0]] },
      { ...history, bars: [...history.bars].reverse() },
      { ...history, adjustment: 'raw' },
      { ...history, unit: { ...history.unit, currency: 'USD' } },
    ]) expect(historySchema.safeParse(invalid).success).toBe(false)
  })
})
