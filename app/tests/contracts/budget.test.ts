import { describe, expect, it } from 'vitest'
import { allocateBudget, reserveProviderCall } from '../../worker/providers/budget.js'

describe('presupuesto de consultas ante fallos de almacenamiento', () => {
  it('no habilita una llamada si D1 rechaza preparaciones por cuota agotada', async () => {
    const exhausted = { prepare: () => { throw new Error('quota exceeded') } } as unknown as D1Database
    expect(await reserveProviderCall(exhausted, { provider: 'synthetic', scope: 'manual',
      windows: [{ seconds: 60, cap: 1 }], nowMs: 1000 })).toEqual({
      allowed: false, reason: 'STORAGE_UNAVAILABLE',
    })
  })

  it('reparte cuotas sin duplicarlas y rechaza dos ventanas idénticas', async () => {
    const allocation = allocateBudget(100)
    expect(Object.values(allocation).reduce((sum, value) => sum + value, 0)).toBe(100)
    expect(await reserveProviderCall({} as D1Database, { provider: 'synthetic',
      scope: 'staging', windows: [{ seconds: 60, cap: 1 }, { seconds: 60, cap: 1 }],
      nowMs: 1000 })).toEqual({ allowed: false, reason: 'CONFIGURATION_MISMATCH' })
  })
})
