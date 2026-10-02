import { describe, expect, it } from 'vitest'
import { newsItemSchema } from '../../shared/contracts/context.js'
import { canonicalNewsUrl, newsPage } from '../../shared/news/page.js'
import { companyId } from '../fixtures/contracts.js'
import { news } from '../fixtures/research.js'

const options = { companyId, kind: 'all', asOf: '2026-10-02T12:00:00Z' }
describe('noticias originales, relacionadas y seguras', () => {
  it('filtra fruta/homónimos mediante identidad verificada, conserva artículos distintos', () => {
    const rows = [news(1, { title: 'Apple anuncia resultados' }), news(2, { title: 'Apple anuncia resultados' }),
      news(3, { title: 'Apple: cosecha de manzanas', companyIds: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'] })]
    expect(newsPage(rows, options).items).toHaveLength(2)
    expect(newsPage(rows, { ...options, kind: 'corporate' }).items).toHaveLength(0)
  })
  it('deduplica URL y seguimiento, sin borrar parámetros de artículos ni fecha original', () => {
    const first = news(1, { url: 'https://example.org/story?id=3&utm_source=x#tracking',
      publishedAt: '2025-01-01T12:00:00Z' })
    const duplicate = news(2, { url: 'https://example.org/story?id=3', publishedAt: '2026-10-01T12:00:00Z' })
    const page = newsPage([first, duplicate], options)
    expect(page.items).toHaveLength(1)
    expect(page.items[0].publishedAt).toBe('2025-01-01T12:00:00Z')
    expect(canonicalNewsUrl(first.url)).toBe('https://example.org/story?id=3')
  })
  it('sanea texto y rechaza enlaces ejecutables, fecha ausente y clasificación omitida', () => {
    const page = newsPage([news(1, { title: '<script>alert(1)</script><b>Título</b>', source: '<i>Medio</i>' })], options)
    expect(page.items[0]).toMatchObject({ title: 'Título', source: 'Medio' })
    expect(() => newsPage([news(1, { url: 'javascript:alert(1)' })], options)).toThrow()
    expect(newsItemSchema.safeParse({ ...news(), publishedAt: null }).success).toBe(false)
    expect(newsItemSchema.safeParse({ ...news(), kind: undefined }).success).toBe(false)
    expect(newsItemSchema.safeParse({ ...news(), publishedDate: '2025-01-01' }).success).toBe(false)
  })
  it('conserva precisión civil sin fabricar medianoche ni zona', () => {
    const row = news(1, { publishedAt: null, publishedDate: '2026-09-20' })
    expect(newsPage([row], options).items[0].publishedAt).toBeNull()
  })
  it('pagina con instantánea fija y valida empresa/filtro antes de avanzar', () => {
    const rows = Array.from({ length: 45 }, (_, index) => news(index))
    const first = newsPage(rows, options)
    expect(first.items).toHaveLength(20)
    const second = newsPage([...rows, news(99, { publishedAt: '2026-10-03T12:00:00Z' })],
      { ...options, asOf: '2026-10-04T12:00:00Z', cursor: first.nextCursor })
    const third = newsPage(rows, { ...options, cursor: second.nextCursor })
    expect(new Set([...first.items, ...second.items, ...third.items].map((item) => item.id)).size).toBe(45)
    expect(third.nextCursor).toBeNull()
    expect(second.snapshotAt).toBe(first.snapshotAt)
    expect(() => newsPage(rows, { ...options, kind: 'corporate', cursor: first.nextCursor })).toThrow('INVALID_CURSOR')
    expect(() => newsPage(rows, { ...options, companyId: news().id, cursor: first.nextCursor })).toThrow('INVALID_CURSOR')
  })
  it('rechaza IDs contradictorios y payloads excesivos', () => {
    expect(() => newsPage([news(1), news(1, { url: 'https://example.org/different' })], options)).toThrow('NEWS_ID_CONFLICT')
    expect(() => newsPage(Array.from({ length: 201 }, (_, i) => news(i)), options)).toThrow('NEWS_PAYLOAD_TOO_LARGE')
  })
})
