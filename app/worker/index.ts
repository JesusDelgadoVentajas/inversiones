import type { HealthResponse } from '../shared/contracts/health.js'

const jsonHeaders = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' }

export default {
  fetch(request) {
    const { pathname } = new URL(request.url)
    if (request.method === 'GET' && pathname === '/api/health') {
      const health: HealthResponse = {
        status: 'preparacion', liveData: false,
        message: 'La base local funciona; todavía no hay fuentes financieras activas.',
      }
      return Response.json(health, { headers: jsonHeaders })
    }
    if (request.method === 'GET' && pathname === '/api/example') {
      return Response.json({
        kind: 'synthetic', status: 'sin-datos', company: 'Empresa de prueba', quote: null,
        message: 'Ejemplo de contrato sin cotización real.',
      }, { headers: jsonHeaders })
    }
    return Response.json({ code: 'NOT_FOUND', message: 'Ruta no disponible.' }, {
      status: 404, headers: jsonHeaders,
    })
  },
} satisfies ExportedHandler<Env>
