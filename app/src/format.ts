import type { Listing } from '../shared/contracts/identity.js'

export const instrumentLabel: Record<Listing['instrument'], string> = {
  ordinary: 'Acción ordinaria', preferred: 'Acción preferente', adr: 'ADR', gdr: 'GDR',
  fund: 'Fondo', other: 'Otro instrumento',
}

export function amount(value: string): string {
  const [integer, fraction] = value.split('.')
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (fraction ? ',' + fraction : '')
}

export function instant(value: string, timeZone: string | null): string {
  const zone = timeZone ?? 'UTC'
  try { return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'medium', timeZone: zone }).format(new Date(value)) + ` (${zone})` }
  catch { return value + ' (UTC)' }
}
