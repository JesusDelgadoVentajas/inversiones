import type { z } from 'zod'

export type TransportError = 'HOST_NOT_APPROVED' | 'TIMEOUT' | 'ABORTED' | 'NETWORK' |
  'UNAUTHORIZED' | 'PLAN_DENIED' | 'RATE_LIMITED' | 'UPSTREAM_ERROR' |
  'HTTP_ERROR' | 'INVALID_RESPONSE' | 'RESPONSE_TOO_LARGE'

export type TransportResult<T> = { ok: true; data: T; bytes: number } |
  { ok: false; code: TransportError; retryAfterMs: number | null }

function retryAfter(value: string | null, nowMs: number): number | null {
  if (!value) return null
  const seconds = Number(value)
  const delay = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : Date.parse(value) - nowMs
  return Number.isFinite(delay) && delay >= 0 ? Math.min(Math.ceil(delay), 3_600_000) : null
}

async function readBody(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const result = await reader.read()
      if (result.done) break
      length += result.value.byteLength
      if (length > maxBytes) {
        await reader.cancel()
        throw new Error('RESPONSE_TOO_LARGE')
      }
      chunks.push(result.value)
    }
  } finally {
    reader.releaseLock()
  }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes) }
  catch { throw new Error('INVALID_RESPONSE') }
}

export async function requestJson<T extends z.ZodType>(options: {
  baseUrl: string
  path: string
  allowedOrigins: readonly string[]
  headers?: Record<string, string>
  schema: T
  signal?: AbortSignal
  timeoutMs?: number
  maxBytes?: number
  fetcher?: typeof fetch
  nowMs?: number
}): Promise<TransportResult<z.infer<T>>> {
  const { path, allowedOrigins, headers = {}, schema, signal,
    timeoutMs = 8000, maxBytes = 524288, fetcher = fetch, nowMs = Date.now() } = options
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 20_000 ||
      !Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > 2_000_000) {
    throw new Error('Límites de transporte inválidos.')
  }
  let url: URL
  try {
    const base = new URL(options.baseUrl)
    url = new URL(path, base)
    if (base.protocol !== 'https:' || !allowedOrigins.includes(base.origin) ||
        !path.startsWith('/') || path.startsWith('//') || url.origin !== base.origin ||
        url.username || url.password || base.username || base.password) {
      return { ok: false, code: 'HOST_NOT_APPROVED', retryAfterMs: null }
    }
  } catch {
    return { ok: false, code: 'HOST_NOT_APPROVED', retryAfterMs: null }
  }
  const deadline = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, deadline]) : deadline
  try {
    const response = await fetcher(url, { method: 'GET', headers: { Accept: 'application/json', ...headers },
      redirect: 'error', signal: combined })
    if (!response.ok) {
      await response.body?.cancel()
      const code: TransportError = response.status === 401 ? 'UNAUTHORIZED' :
        response.status === 403 ? 'PLAN_DENIED' : response.status === 429 ? 'RATE_LIMITED' :
          response.status >= 500 ? 'UPSTREAM_ERROR' : 'HTTP_ERROR'
      return { ok: false, code, retryAfterMs: code === 'RATE_LIMITED' ?
        retryAfter(response.headers.get('retry-after'), nowMs) : null }
    }
    const type = response.headers.get('content-type')?.toLowerCase() ?? ''
    const length = Number(response.headers.get('content-length'))
    if ((!type.includes('application/json') && !type.includes('+json')) ||
        (Number.isFinite(length) && length > maxBytes)) {
      await response.body?.cancel()
      return { ok: false, code: length > maxBytes ? 'RESPONSE_TOO_LARGE' : 'INVALID_RESPONSE',
        retryAfterMs: null }
    }
    const body = await readBody(response, maxBytes)
    const data = schema.safeParse(JSON.parse(body))
    if (!data.success) return { ok: false, code: 'INVALID_RESPONSE', retryAfterMs: null }
    return { ok: true, data: data.data, bytes: new TextEncoder().encode(body).length }
  } catch (error) {
    const code: TransportError = error instanceof Error && error.message === 'RESPONSE_TOO_LARGE'
      ? 'RESPONSE_TOO_LARGE' : signal?.aborted ? 'ABORTED' : deadline.aborted ? 'TIMEOUT' :
        error instanceof SyntaxError || error instanceof Error && error.message === 'INVALID_RESPONSE'
          ? 'INVALID_RESPONSE' : 'NETWORK'
    return { ok: false, code, retryAfterMs: null }
  }
}
