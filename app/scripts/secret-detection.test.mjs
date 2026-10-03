import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { configuredValues, containsSecret, privateFile } from './secret-detection.mjs'

test('detecta claves sintéticas sin prefijo y sus representaciones en artefactos', () => {
  const key = 'synthetic/key with+special=characters'
  const values = configuredValues([{ STOCKLAKE_API_KEY: key }])
  for (const representation of [key, encodeURIComponent(key), Buffer.from(key).toString('base64')]) {
    assert.equal(containsSecret('public-artifact:' + representation, values), true)
  }
  const escaped = 'synthetic-key-with-"quotes"-and-\\slashes'
  assert.equal(containsSecret(JSON.stringify({ key: escaped }),
    configuredValues([{ FINNHUB_API_KEY: escaped }])), true)
  assert.equal(containsSecret('FINNHUB_API_KEY: readFromPrivateEnvironment', values), false)
})

test('revisa por separado el correo SEC aunque no se filtre todo el User-Agent', () => {
  const contact = 'synthetic-owner@example.invalid'
  const values = configuredValues([{ SEC_USER_AGENT: 'Synthetic research ' + contact }])
  assert.equal(containsSecret('contact=' + contact, values), true)
  assert.equal(containsSecret('contact=' + encodeURIComponent(contact), values), true)
  assert.equal(containsSecret('contact unavailable', values), false)
})

test('detecta cada correo autorizado aunque se filtre sin la lista JSON completa', () => {
  const emails = ['synthetic-first@example.invalid', 'synthetic-second@example.invalid']
  const values = configuredValues([{ ACCESS_ALLOWED_EMAILS: JSON.stringify(emails) }])
  for (const email of emails) {
    for (const value of [email, encodeURIComponent(email), Buffer.from(email).toString('base64')]) {
      assert.equal(containsSecret('public-contact=' + value, values), true)
    }
  }
  assert.equal(containsSecret('ACCESS_ALLOWED_EMAILS: readFromPrivateEnvironment', values), false)
})

test('conserva los patrones de claves privadas sin convertir nombres de variables en secretos', () => {
  assert.equal(containsSecret(['-----BEGIN', 'PRIVATE KEY-----'].join(' ')), true)
  assert.equal(containsSecret('github_pat_' + 'SYNTHETIC'.repeat(6)), true)
  assert.equal(containsSecret('SEC_USER_AGENT and ACCESS_AUD are privateNames'), false)
})

test('las rutas privadas incluyen variantes por entorno y las plantillas son reconocibles', () => {
  for (const path of ['.env', 'app/.dev.vars.production', '.local/notes.json', 'app/test.key']) {
    assert.equal(privateFile(path), true)
  }
  assert.equal(privateFile('app/scripts/check-secrets.mjs'), false)
  assert.equal(privateFile('app/.dev.vars.example'), false)
  assert.equal(privateFile('.env.example'), false)
})

test('la CLI revisa mapas compilados y falla sin divulgar la clave sintética', () => {
  const root = mkdtempSync(join(tmpdir(), 'inversiones-secret-check-'))
  const app = join(root, 'app')
  const secret = 'synthetic-secret-used-only-in-temporary-build'
  try {
    mkdirSync(join(app, 'dist', 'assets'), { recursive: true })
    execFileSync('git', ['init', '--quiet'], { cwd: root })
    writeFileSync(join(root, '.gitignore'), 'app/dist/\n.dev.vars\n')
    writeFileSync(join(root, '.dev.vars'), 'FINNHUB_API_KEY=' + secret + '\n')
    const script = new URL('./check-secrets.mjs', import.meta.url).pathname
    const run = () => spawnSync(process.execPath, [script], { cwd: app, env: {}, encoding: 'utf8' })
    assert.equal(run().status, 0)
    const map = join(app, 'dist', 'assets', 'synthetic.js.map')
    writeFileSync(map, JSON.stringify({ sourcesContent: ['key=' + secret] }))
    const leaked = run()
    assert.equal(leaked.status, 1)
    assert.match(leaked.stderr, /synthetic\.js\.map/)
    assert.equal((leaked.stdout + leaked.stderr).includes(secret), false)
    rmSync(map)
    assert.equal(run().status, 0)
    execFileSync('git', ['add', '--force', '.dev.vars'], { cwd: root })
    assert.match(run().stderr, /Ruta privada preparada para Git/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
