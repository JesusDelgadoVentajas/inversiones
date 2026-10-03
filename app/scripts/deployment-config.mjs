export const privateNames = ['ACCESS_TEAM_DOMAIN', 'ACCESS_AUD', 'ACCESS_ALLOWED_EMAILS', 'ACCESS_OWNER_EMAIL',
  'SEC_USER_AGENT', 'FINNHUB_API_KEY', 'ALPACA_API_KEY', 'ALPACA_API_SECRET', 'STOCKLAKE_API_KEY']

const environments = { staging: 'inversiones-staging', production: 'inversiones' }
const databaseNames = { staging: 'inversiones-staging', production: 'inversiones-production' }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const safe = (value) => value?.preview_urls === false && value.previews == null &&
  value.vars?.APP_READY === 'false' && value.vars?.ALLOW_LIVE_PROVIDERS === 'false' &&
  privateNames.every((name) => !(name in value.vars))

function validDatabase(database, environment) {
  return database?.binding === 'DB' && database.database_name === databaseNames[environment] &&
    uuid.test(database.database_id) && database.migrations_dir === 'migrations'
}

export function validConfig(config) {
  if (!safe(config) || !config.assets?.run_worker_first?.includes('/api/*') ||
      config.d1_databases?.length !== 1 || config.d1_databases[0].binding !== 'DB' ||
      config.d1_databases[0].database_id !== 'local-only' ||
      config.d1_databases[0].database_name !== 'inversiones-local' ||
      config.d1_databases[0].migrations_dir !== 'migrations') return false
  const bindings = []
  for (const [environment, name] of Object.entries(environments)) {
    const value = config.env?.[environment]
    if (!safe(value) || value.name !== name || !Array.isArray(value.d1_databases) ||
        value.d1_databases.length > 1) return false
    const binding = value.d1_databases[0]
    if (binding && !validDatabase(binding, environment)) return false
    bindings.push(binding)
  }
  return bindings.every((binding) => !binding) ||
    bindings.every(Boolean) && bindings[0].database_id !== bindings[1].database_id
}

export function validBuild(config, built, environment) {
  if (!Object.hasOwn(environments, environment) || !validConfig(config) || !safe(built) ||
      built.name !== environments[environment] || !Array.isArray(built.d1_databases)) return false
  const expected = config.env[environment].d1_databases
  if (built.d1_databases.length !== expected.length) return false
  return expected.length === 0 || built.d1_databases[0].binding === 'DB' &&
    built.d1_databases[0].database_id === expected[0].database_id &&
    built.d1_databases[0].database_name === expected[0].database_name
}
