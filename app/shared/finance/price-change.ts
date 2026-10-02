import { quoteSchema } from '../contracts/financial.js'
import type { Quote } from '../contracts/financial.js'
import { decimalFromScaled, roundedRatio, scaledDecimal } from './decimal.js'

export type PriceChange = { available: true; absolute: string; percent: string } |
  { available: false; reason: 'PREVIOUS_CLOSE_MISSING' | 'PREVIOUS_CLOSE_INCOMPATIBLE' | 'ZERO_BASE' }

export function priceChange(input: Quote): PriceChange {
  const quote = quoteSchema.parse(input)
  const previous = quote.previousClose
  if (!previous) return { available: false, reason: 'PREVIOUS_CLOSE_MISSING' }
  if (previous.listingId !== quote.listingId || previous.unit.currency !== quote.unit.currency ||
      previous.unit.unit !== quote.unit.unit ||
      scaledDecimal(previous.unit.unitToMajor) !== scaledDecimal(quote.unit.unitToMajor) ||
      previous.feed !== quote.feed || Date.parse(previous.observedAt) >= Date.parse(quote.observedAt) ||
      previous.shareBasis !== 'current_shares') {
    return { available: false, reason: 'PREVIOUS_CLOSE_INCOMPATIBLE' }
  }
  const base = scaledDecimal(previous.price)
  if (base === 0n) return { available: false, reason: 'ZERO_BASE' }
  const difference = scaledDecimal(quote.price) - base
  return { available: true, absolute: decimalFromScaled(difference),
    percent: decimalFromScaled(roundedRatio(difference * 100n * 1_000_000n, base), 6) }
}
