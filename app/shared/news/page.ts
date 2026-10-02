import { z } from 'zod'
import { newsItemSchema, newsKindSchema } from '../contracts/context.js'
import type { NewsItem, NewsPage } from '../contracts/context.js'
import { civilDate, stableId, utcInstant } from '../contracts/primitives.js'

export const newsLabels = { corporate: 'Comunicado corporativo', independent: 'Noticia independiente',
  regulatory: 'Publicación regulatoria', sector: 'Sector', macro: 'Contexto macroeconómico' }
export function plainText(value: string): string {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '').replace(/<[^>]*>/g, '')
    .replace(/\p{Cc}/gu, (character) => /\s/.test(character) ? ' ' : '')
    .replace(/[\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\s+/g, ' ').trim()
}
export function canonicalNewsUrl(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('INVALID_NEWS_URL')
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || ['fbclid', 'gclid'].includes(key.toLowerCase())) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  return url.href
}
const day = (item: NewsItem) => item.publishedAt?.slice(0, 10) ?? item.publishedDate!
const key = (item: NewsItem) => [day(item), item.publishedAt ? '1' : '0',
  item.publishedAt ?? '', item.id].join('|')
const cursorSchema = z.object({ companyId: stableId, kind: newsKindSchema,
  snapshotAt: utcInstant, date: civilDate, instant: utcInstant.nullable(), id: stableId }).strict()
export class InvalidNewsCursor extends Error {}

export function parseNewsCursor(cursor: string | null, companyId: string, kind: string, asOf: string) {
  if (!cursor) return null
  try {
    if (!/^[A-Za-z0-9_-]{1,700}$/.test(cursor)) throw new Error('INVALID')
    const value = cursorSchema.parse(JSON.parse(atob(cursor.replace(/-/g, '+').replace(/_/g, '/'))))
    if (value.companyId !== companyId || value.kind !== kind || Date.parse(value.snapshotAt) > Date.parse(asOf) ||
      value.date > value.snapshotAt.slice(0, 10) || value.instant &&
      (value.instant.slice(0, 10) !== value.date || Date.parse(value.instant) > Date.parse(value.snapshotAt))) {
      throw new Error('INVALID')
    }
    return value
  } catch { throw new InvalidNewsCursor('INVALID_CURSOR') }
}

export function newsPage(input: NewsItem[], options: { companyId: string; kind: string; asOf: string;
  cursor?: string | null }): NewsPage {
  stableId.parse(options.companyId); utcInstant.parse(options.asOf)
  const kind = newsKindSchema.parse(options.kind)
  const cursor = parseNewsCursor(options.cursor ?? null, options.companyId, kind, options.asOf)
  const snapshotAt = cursor?.snapshotAt ?? options.asOf
  const unique = new Map<string, NewsItem>()
  const identifiers = new Map<string, string>()
  if (input.length > 200) throw new Error('NEWS_PAYLOAD_TOO_LARGE')
  for (const row of input) {
    const item = newsItemSchema.parse(row)
    if (!item.companyIds.includes(options.companyId) || kind !== 'all' && item.kind !== kind ||
      (item.publishedAt ? Date.parse(item.publishedAt) > Date.parse(snapshotAt) : day(item) > snapshotAt.slice(0, 10))) continue
    const sanitized = newsItemSchema.parse({ ...item, title: plainText(item.title),
      source: plainText(item.source), relationReason: plainText(item.relationReason),
      url: canonicalNewsUrl(item.url) })
    if (identifiers.has(sanitized.id) && identifiers.get(sanitized.id) !== sanitized.url) throw new Error('NEWS_ID_CONFLICT')
    identifiers.set(sanitized.id, sanitized.url)
    const known = unique.get(sanitized.url)
    // Conservar la publicación original, nunca el día en que la descubrimos.
    if (!known || key(sanitized) < key(known)) unique.set(sanitized.url, sanitized)
  }
  const cursorKey = cursor ? [cursor.date, cursor.instant ? '1' : '0', cursor.instant ?? '', cursor.id].join('|') : null
  const ordered = [...unique.values()].sort((a, b) => key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0)
    .filter((item) => !cursorKey || key(item) < cursorKey)
  const items = ordered.slice(0, 20)
  const last = items.at(-1)
  return { items, snapshotAt, nextCursor: ordered.length > items.length && last ? btoa(JSON.stringify({
    companyId: options.companyId, kind, snapshotAt, date: day(last), instant: last.publishedAt, id: last.id,
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : null }
}
