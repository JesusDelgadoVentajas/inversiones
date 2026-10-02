import { privateNames } from './deployment-config.mjs'

const privatePath = /(?:^|\/)(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|\.local(?:\/.*)?|[^/]+\.(?:pem|key))$/
const tokenPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/,
]

// Valores conocidos: detecta también claves sin prefijo y contactos privados.
// El resultado es booleano; los valores nunca forman parte de un diagnóstico.
export function configuredValues(environments) {
  const values = new Set()
  for (const env of environments) {
    for (const name of privateNames) {
      const value = env[name]?.trim()
      if (!value || value.length < 8) continue
      values.add(value)
      if (name === 'SEC_USER_AGENT') {
        for (const contact of value.match(/[^\s<>]+@[^\s<>]+\.[^\s<>]+/g) ?? []) values.add(contact)
      }
    }
  }
  return [...values].flatMap((value) => [value, JSON.stringify(value).slice(1, -1),
    encodeURIComponent(value), Buffer.from(value).toString('base64')])
}

export function containsSecret(content, values = []) {
  return tokenPatterns.some((pattern) => pattern.test(content)) ||
    values.some((value) => content.includes(value))
}

export function privateFile(path) {
  return privatePath.test(path) && !path.endsWith('.example')
}
