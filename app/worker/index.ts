import type { HealthResponse } from '../shared/contracts/health.js'
import { verifyAccess } from './auth/access.js'
import { apiError } from './routes/errors.js'
import { createDataApi } from './routes/data.js'
import { approvedProviders } from './providers/registry.js'
import type { RegisteredProvider } from './providers/registry.js'

const jsonHeaders = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' }

export function createWorker(providers: readonly RegisteredProvider[] = approvedProviders) {
  return {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    const requestId = crypto.randomUUID()
    if (request.method === 'GET' && (pathname === '/api/health' || pathname === '/api/v1/health')) {
      const active = env.APP_READY === 'true' && env.ALLOW_LIVE_PROVIDERS === 'true' && providers.length > 0
      const health: HealthResponse = {
        status: active ? 'operativa' : 'preparacion', liveData: active,
        searchAvailable: active &&
          providers.some(({ adapter, identityRetentionAllowed }) => identityRetentionAllowed &&
            adapter.capabilities.has('search') && !!adapter.search),
        message: active ? 'Consulta la cobertura de cada bloque.' : 'La aplicación está en preparación; todavía no hay fuentes financieras activas.',
      }
      return Response.json(health, { headers: jsonHeaders })
    }
    if (request.method === 'GET' && pathname === '/api/example') {
      return Response.json({
        kind: 'synthetic', status: 'sin-datos', company: 'Empresa de prueba', quote: null,
        message: 'Ejemplo de contrato sin cotización real.',
      }, { headers: jsonHeaders })
    }
    if (pathname.startsWith('/api/v1/')) {
      const access = await verifyAccess(request, env ?? {})
      if (!access.ok) {
        const status = access.code === 'ACCESS_NOT_CONFIGURED' ? 503 :
          access.code === 'ACCESS_TOKEN_MISSING' ? 401 : 403
        return apiError(status, access.code, 'Acceso no disponible.', requestId)
      }
      if (env.APP_READY !== 'true') {
        return apiError(503, 'APP_NOT_READY', 'Los datos todavía no están habilitados.', requestId)
      }
      try {
        return await createDataApi(env.DB, env.ALLOW_LIVE_PROVIDERS === 'true' ? providers : [])(request, requestId)
      } catch {
        return apiError(503, 'DATA_UNAVAILABLE', 'No se pudo comprobar este bloque.', requestId)
      }
    }
    return apiError(404, 'NOT_FOUND', 'Ruta no disponible.', requestId)
  },
  } satisfies ExportedHandler<Env>
}

export default createWorker()
