import { describe, expect, it } from 'vitest'
import { cacheTtl } from '../../worker/cache/policy.js'

describe('caducidad de caché por bloque y licencia', () => {
  it('usa el menor plazo entre producto y permiso de la fuente', () => {
    expect(cacheTtl('quote', 3600)).toBe(10)
    expect(cacheTtl('news', 60)).toBe(60)
    expect(cacheTtl('peers', 30 * 86400)).toBe(7 * 86400)
    expect(cacheTtl('macro', 7200)).toBe(3600)
  })

  it('prohíbe retener sin derecho confirmado', () => {
    expect(cacheTtl('quote', null)).toBe(0)
    expect(cacheTtl('quote', 0)).toBe(0)
    expect(() => cacheTtl('quote', -1)).toThrow()
  })
})
