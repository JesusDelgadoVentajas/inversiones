import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validBuild, validConfig } from './deployment-config.mjs'

const environment = process.argv[2]
if (!['staging', 'production'].includes(environment)) {
  console.error('Indica staging o production. No se publica ningún artefacto desde este script.')
  process.exit(1)
}

const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'))
if (!validConfig(config)) {
  console.error('La configuración del entorno no coincide con la preparación segura.')
  process.exit(1)
}

const vite = resolve('node_modules/vite/bin/vite.js')
const result = spawnSync(process.execPath, [vite, 'build'], {
  stdio: 'inherit', env: { ...process.env, CLOUDFLARE_ENV: environment },
})
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

const built = JSON.parse(readFileSync('dist/inversiones/wrangler.json', 'utf8'))
if (!validBuild(config, built, environment)) {
  console.error('La compilación seleccionó otro Worker, o habilitó datos reales.')
  process.exit(1)
}
console.log(`Artefacto ${environment} comprobado; Worker ${built.name}; datos reales desactivados.`)
