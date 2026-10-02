import { readFileSync } from 'node:fs'
import { validConfig } from './deployment-config.mjs'

const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'))
if (!validConfig(config)) {
  console.error('Configuración inesperada: revisa rutas API, entornos, datos reales y bindings.')
  process.exit(1)
}
console.log('Configuración local, staging y production comprobada; datos reales desactivados.')
