import { apiErrorSchema } from '../../shared/contracts/errors.js'

export function apiError(status: number, code: string, message: string, requestId: string): Response {
  const body = apiErrorSchema.parse({ code, message, requestId,
    at: new Date().toISOString(), retryable: status === 429 || status >= 500 })
  return Response.json(body, {
    status, headers: { 'Cache-Control': 'private, no-store',
      'Content-Type': 'application/json; charset=utf-8' },
  })
}
