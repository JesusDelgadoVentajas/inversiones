import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validBuild, validConfig, privateNames } from './deployment-config.mjs'

const configuration = () => JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8'))
function prepared() {
  const config = configuration()
  for (const [environment, id] of [['staging', '11111111-1111-4111-8111-111111111111'],
    ['production', '22222222-2222-4222-8222-222222222222']]) {
    config.env[environment].d1_databases = [{ binding: 'DB', database_name:
      environment === 'staging' ? 'inversiones-staging' : 'inversiones-production',
    database_id: id, migrations_dir: 'migrations' }]
  }
  return config
}

test('acepta preparación vacía y bases remotas distintas, conservando la base local', () => {
  const config = prepared()
  assert.equal(validConfig(config), true)
  config.env.staging.d1_databases = []
  assert.equal(validConfig(config), false)
  config.env.production.d1_databases = []
  assert.equal(validConfig(config), true)
})

test('rechaza base compartida, binding local remoto, nombre cruzado e ID inválido', () => {
  for (const patch of [
    { database_id: prepared().env.production.d1_databases[0].database_id },
    { database_id: 'local-only' }, { database_name: 'inversiones-production' },
    { binding: 'OTHER' }, { migrations_dir: '../other' },
  ]) {
    const config = prepared()
    Object.assign(config.env.staging.d1_databases[0], patch)
    assert.equal(validConfig(config), false)
  }
})

test('mantiene datos apagados, API primero, previews desactivadas y secretos fuera de vars', () => {
  for (const area of ['root', 'staging', 'production']) {
    for (const patch of [{ preview_urls: true }, { previews: {} },
      { vars: { APP_READY: 'true', ALLOW_LIVE_PROVIDERS: 'false' } },
      ...privateNames.map((name) => ({ vars: {
        APP_READY: 'false', ALLOW_LIVE_PROVIDERS: 'false', [name]: 'synthetic-only',
      } }))]) {
      const config = prepared()
      Object.assign(area === 'root' ? config : config.env[area], patch)
      assert.equal(validConfig(config), false)
    }
  }
  const config = prepared()
  config.assets.run_worker_first = []
  assert.equal(validConfig(config), false)
})

test('el artefacto debe conservar la D1 del entorno solicitado y todos sus controles', () => {
  const config = prepared()
  const built = structuredClone(config.env.staging)
  assert.equal(validBuild(config, built, 'staging'), true)
  assert.equal(validBuild(config, built, 'production'), false)
  built.d1_databases = config.env.production.d1_databases
  assert.equal(validBuild(config, built, 'staging'), false)
  built.d1_databases = []
  assert.equal(validBuild(config, built, 'staging'), false)
})
