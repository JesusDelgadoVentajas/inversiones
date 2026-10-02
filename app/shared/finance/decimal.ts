import { decimal } from '../contracts/primitives.js'

export const DECIMAL_SCALE = 10n ** 12n

export function scaledDecimal(value: string): bigint {
  decimal.parse(value)
  const negative = value.startsWith('-')
  const [integer, fraction = ''] = value.replace(/^-/, '').split('.')
  const scaled = BigInt(integer + fraction.padEnd(12, '0'))
  return negative ? -scaled : scaled
}

export function decimalFromScaled(value: bigint, places = 12): string {
  const digits = (value < 0n ? -value : value).toString().padStart(places + 1, '0')
  const fraction = digits.slice(-places).replace(/0+$/, '')
  return `${value < 0n ? '-' : ''}${digits.slice(0, -places)}${fraction ? '.' + fraction : ''}`
}

export function roundedRatio(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error('Base de cálculo no positiva.')
  const magnitude = numerator < 0n ? -numerator : numerator
  const rounded = (magnitude + denominator / 2n) / denominator
  return numerator < 0n ? -rounded : rounded
}
