import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'
import { configuredValues, containsSecret, privateFile } from './secret-detection.mjs'

const root = resolve('..')
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root, encoding: 'utf8',
}).split('\0').filter(Boolean)

const environments = [process.env]
for (const directory of [root, resolve('.')]) {
  for (const name of readdirSync(directory)) {
    if (!/^(?:\.env|\.dev\.vars)(?:\..*)?$/.test(name) || name.endsWith('.example')) continue
    const path = resolve(directory, name)
    if (statSync(path).isFile()) {
      try { environments.push(parseEnv(readFileSync(path, 'utf8'))) } catch {
        console.error('No se pudo leer una configuración privada para revisar secretos.')
        process.exit(1)
      }
    }
  }
}
const values = configuredValues(environments)
const errors = []
let scanned = 0
function scan(file, path) {
  if (statSync(path).size > 5_000_000) {
    errors.push(`Archivo demasiado grande para revisar: ${file}`)
    return
  }
  const content = readFileSync(path, 'utf8')
  scanned += 1
  if (containsSecret(content, values)) errors.push(`Posible secreto en: ${file}`)
}
for (const file of files) {
  if (privateFile(file)) {
    errors.push(`Ruta privada preparada para Git: ${file}`)
    continue
  }
  const path = resolve(root, file)
  if (!existsSync(path)) continue // Git aún puede incluir un archivo eliminado en el diff.
  scan(file, path)
}
function scanBuild(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) scanBuild(path)
    else if (entry.isFile()) scan(path.slice(root.length + 1), path)
  }
}
const sourceScanned = scanned
const build = resolve('dist')
if (existsSync(build)) scanBuild(build)
if (errors.length) {
  for (const error of errors) console.error(error)
  process.exit(1)
}
console.log(`${sourceScanned} archivos versionables y ${scanned - sourceScanned} archivos compilados revisados; sin coincidencias de patrones ni valores privados configurados.`)
