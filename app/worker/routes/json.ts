import { apiError } from './errors.js'

export function privateJson(body: unknown, requestId: string): Response {
  const encoded = JSON.stringify(body)
  if (new TextEncoder().encode(encoded).length > 2_000_000) {
    return apiError(503, 'RESPONSE_TOO_LARGE', 'La respuesta supera el tamaño admitido.', requestId)
  }
  return new Response(encoded, { headers: { 'Cache-Control': 'private, no-store',
    'Content-Type': 'application/json; charset=utf-8' } })
}
