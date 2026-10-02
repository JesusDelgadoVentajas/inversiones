import type { z } from 'zod'
import { apiErrorSchema } from '../shared/contracts/errors.js'

export class ApiFailure extends Error {
  readonly code: string
  readonly status: number
  constructor(code: string, status: number) { super(code); this.code = code; this.status = status }
}

export async function readApi<T>(path: string, schema: z.ZodType<T>, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', signal: AbortSignal.any([
    signal, AbortSignal.timeout(22_000),
  ]), headers: { Accept: 'application/json' } })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new ApiFailure(response.status === 200 ? 'SESSION_REQUIRED' : 'INVALID_RESPONSE', response.status)
  }
  const body: unknown = await response.json()
  if (!response.ok) {
    const error = apiErrorSchema.safeParse(body)
    throw new ApiFailure(error.success ? error.data.code : 'REQUEST_FAILED', response.status)
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new ApiFailure('INVALID_RESPONSE', response.status)
  return parsed.data
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiFailure) {
    if (isSessionFailure(error)) return 'Tu sesión no está disponible. Vuelve a iniciar sesión.'
    if (error.code === 'LISTING_NOT_FOUND') return 'No encontramos este instrumento. Busca de nuevo por nombre.'
    if (error.code === 'APP_NOT_READY' || error.code === 'ACCESS_NOT_CONFIGURED') return 'El acceso a datos aún está en preparación.'
    if (error.status === 429) return 'Se ha alcanzado el límite de consultas. Espera antes de actualizar.'
  }
  return 'No se pudo comprobar la información. Puedes volver a intentarlo.'
}

export function isSessionFailure(error: unknown): boolean {
  return error instanceof ApiFailure && ([401, 403].includes(error.status) || error.code === 'SESSION_REQUIRED')
}

export function blockMessage(reason: string | null): string {
  const messages: Record<string, string> = {
    NO_APPROVED_PROVIDER: 'Todavía no hay una fuente comprobada para este bloque.',
    PRIVATE_COMPANY: 'Esta empresa no cotiza en las fuentes consultadas.',
    EXCLUDED_INSTRUMENT: 'Los resultados pertenecen a instrumentos que esta ficha no admite.',
    HISTORY_NOT_COVERED: 'La fuente no cubre este histórico.',
    RATE_LIMITED: 'Se ha alcanzado el límite de consultas.',
    REFRESH_IN_PROGRESS: 'La actualización ya está en curso.',
  }
  return reason && messages[reason] ? messages[reason] : 'La fuente no ofrece este dato o no se ha podido comprobar.'
}
