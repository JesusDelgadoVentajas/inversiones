import { describe, expect, it } from 'vitest'
import worker from '../../worker/index.js'

describe('API local de preparación', () => {
  it('expone salud sin activar datos reales', async () => {
    const response = await worker.fetch(new Request('https://local.test/api/health'))
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toMatchObject({ status: 'preparacion', liveData: false })
  })

  it('etiqueta explícitamente el ejemplo como sintético', async () => {
    const response = await worker.fetch(new Request('https://local.test/api/example'))
    expect(await response.json()).toMatchObject({ kind: 'synthetic', quote: null })
  })

  it('responde JSON 404 a rutas API desconocidas', async () => {
    const response = await worker.fetch(new Request('https://local.test/api/unknown'))
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' })
  })
})
