import type { HealthResponse } from '../shared/contracts/health.js'
import { verifyAccess } from './auth/access.js'
import { apiError } from './routes/errors.js'

const jsonHeaders = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' }

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    const requestId = crypto.randomUUID()
    if (request.method === 'GET' && (pathname === '/api/health' || pathname === '/api/v1/health')) {
      const health: HealthResponse = {
        status: 'preparacion', liveData: false,
        message: 'La aplicación está en preparación; todavía no hay fuentes financieras activas.',
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
    }
    return apiError(404, 'NOT_FOUND', 'Ruta no disponible.', requestId)
  },
} satisfies ExportedHandler<Env>
