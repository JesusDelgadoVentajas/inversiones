import assert from 'node:assert/strict'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const wrangler = resolve('node_modules/.bin/wrangler')
const temporary = mkdtempSync(join(tmpdir(), 'inversiones-d1-'))
const persistence = join(temporary, 'state')
const config = join(temporary, 'wrangler.jsonc')
const migrationDir = join(temporary, 'migrations')

function run(args, expectSuccess = true) {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: temporary, encoding: 'utf8', env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false' },
    timeout: 30_000,
  })
  if (result.error) throw result.error
  assert.equal(result.status === 0, expectSuccess,
    `Resultado inesperado de ${args.slice(0, 3).join(' ')}: ${result.stderr.slice(0, 500)}`)
  return result.stdout
}

try {
  mkdirSync(migrationDir)
  writeFileSync(config, JSON.stringify({
    name: 'inversiones-migration-test', main: 'worker.js', compatibility_date: '2026-10-01',
    d1_databases: [{ binding: 'DB', database_name: 'inversiones-local',
      database_id: 'local-only', migrations_dir: 'migrations' }],
  }))
  const common = ['DB', '--local', '--persist-to', persistence]
  copyFileSync('migrations/0001_core.sql', join(migrationDir, '0001_core.sql'))
  run(['d1', 'migrations', 'apply', ...common])

  const companyId = '11111111-1111-4111-8111-111111111111'
  const listingId = '22222222-2222-4222-8222-222222222222'
  const insert = (statement) => run(['d1', 'execute', ...common, '--command', statement])
  insert(`INSERT INTO companies(id,legal_name,created_at) VALUES('${companyId}','Empresa sintética','2026-10-02T00:00:00Z')`)
  insert(`INSERT INTO listings(id,company_id,symbol,mic,currency,instrument,status) VALUES('${listingId}','${companyId}','EINV','XLON','GBP','ordinary','active')`)
  insert("INSERT INTO cache_entries(cache_key,body_json,provenance_json,methodology_version,checked_at,expires_at,created_at) VALUES('test','{\"value\":\"0\"}','[]','v1',100,200,100)")

  copyFileSync('migrations/0002_cache_access.sql', join(migrationDir, '0002_cache_access.sql'))
  run(['d1', 'migrations', 'apply', ...common])
  copyFileSync('migrations/0003_provider_slots.sql', join(migrationDir, '0003_provider_slots.sql'))
  run(['d1', 'migrations', 'apply', ...common])
  copyFileSync('migrations/0004_cache_origin.sql', join(migrationDir, '0004_cache_origin.sql'))
  run(['d1', 'migrations', 'apply', ...common])
  const rows = JSON.parse(run(['d1', 'execute', ...common, '--command',
    'SELECT c.legal_name AS name, l.symbol, e.last_accessed_at AS accessed, e.provider FROM companies c JOIN listings l ON l.company_id=c.id JOIN cache_entries e ON e.cache_key=\'test\'', '--json']))
  assert.deepEqual(rows[0].results, [{ name: 'Empresa sintética', symbol: 'EINV', accessed: 0,
    provider: 'legacy' }])

  run(['d1', 'execute', ...common, '--command',
    `INSERT INTO listings(id,company_id,symbol,mic,currency,instrument,status) VALUES('${crypto.randomUUID()}','${companyId}','EINV','XLON','GBP','ordinary','active')`], false)
  run(['d1', 'execute', ...common, '--command',
    `INSERT INTO listings(id,company_id,symbol,mic,currency,instrument,status) VALUES('${crypto.randomUUID()}','${crypto.randomUUID()}','BAD','XLON','GBP','ordinary','active')`], false)
  run(['d1', 'execute', ...common, '--command',
    `INSERT INTO provider_mappings(id,provider,company_id,listing_id,external_id) VALUES('${crypto.randomUUID()}','synthetic','${companyId}','${listingId}','BOTH')`], false)
  run(['d1', 'execute', ...common, '--command',
    `INSERT INTO companies(id,legal_name,aliases_json,created_at) VALUES('${crypto.randomUUID()}','Malformada','{bad','2026-10-02T00:00:00Z')`], false)
  console.log('D1 local: migración desde vacío y desde 0001, datos preservados y restricciones comprobadas.')
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
