import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve('..')
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root, encoding: 'utf8',
}).split('\0').filter(Boolean)

const privatePath = /(?:^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|\.local(?:\/.*)?|[^/]+\.(?:pem|key))$/
const tokenPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/,
]
const errors = []
let scanned = 0
function scan(file, path) {
  if (statSync(path).size > 5_000_000) {
    errors.push(`Archivo demasiado grande para revisar: ${file}`)
    return
  }
  const content = readFileSync(path, 'utf8')
  scanned += 1
  if (tokenPatterns.some((pattern) => pattern.test(content))) errors.push(`Posible secreto en: ${file}`)
}
for (const file of files) {
  if (privatePath.test(file) && !file.endsWith('.example')) {
    errors.push(`Ruta privada preparada para Git: ${file}`)
    continue
  }
  const path = resolve(root, file)
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
console.log(`${sourceScanned} archivos versionables y ${scanned - sourceScanned} archivos compilados revisados; sin coincidencias de los patrones comprobados.`)
