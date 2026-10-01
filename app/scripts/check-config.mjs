import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'))
const apiFirst = config.assets?.run_worker_first?.includes('/api/*')
const safe = (vars) => vars?.APP_READY === 'false' && vars?.ALLOW_LIVE_PROVIDERS === 'false'

if (!apiFirst || !safe(config.vars) || !safe(config.env?.staging?.vars) ||
    !safe(config.env?.production?.vars) || config.env?.staging?.name !== 'inversiones-staging' ||
    config.env?.production?.name !== 'inversiones' || config.d1_databases) {
  console.error('Configuración inesperada: revisa rutas API, entornos, datos reales y bindings.')
  process.exit(1)
}
console.log('Configuración local, staging y production comprobada; datos reales desactivados.')
