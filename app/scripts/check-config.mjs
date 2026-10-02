import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'))
const apiFirst = config.assets?.run_worker_first?.includes('/api/*')
const safe = (vars) => vars?.APP_READY === 'false' && vars?.ALLOW_LIVE_PROVIDERS === 'false'
const privateNames = ['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD', 'ACCESS_OWNER_EMAIL',
  'FINNHUB_API_KEY', 'ALPACA_API_KEY', 'ALPACA_API_SECRET']
const noPrivateVars = (vars) => privateNames.every((name) => !(name in (vars ?? {})))

if (!apiFirst || !safe(config.vars) || !safe(config.env?.staging?.vars) ||
    !safe(config.env?.production?.vars) || config.env?.staging?.name !== 'inversiones-staging' ||
    config.env?.production?.name !== 'inversiones' ||
    !noPrivateVars(config.vars) || !noPrivateVars(config.env?.staging?.vars) ||
    !noPrivateVars(config.env?.production?.vars) ||
    config.d1_databases?.length !== 1 || config.d1_databases[0].binding !== 'DB' ||
    config.d1_databases[0].database_id !== 'local-only' ||
    config.env?.staging?.d1_databases?.length !== 0 ||
    config.env?.production?.d1_databases?.length !== 0) {
  console.error('Configuración inesperada: revisa rutas API, entornos, datos reales y bindings.')
  process.exit(1)
}
console.log('Configuración local, staging y production comprobada; datos reales desactivados.')
