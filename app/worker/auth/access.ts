import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { JWTVerifyGetKey } from 'jose'
import { z } from 'zod'

export interface AccessSettings {
  ACCESS_TEAM_DOMAIN?: string
  ACCESS_AUD?: string
  ACCESS_ALLOWED_EMAILS?: string
}

type AccessResult = { ok: true } | { ok: false; code: 'ACCESS_NOT_CONFIGURED' | 'ACCESS_TOKEN_MISSING' | 'ACCESS_DENIED' }
let cachedKeys: { domain: string; keys: ReturnType<typeof createRemoteJWKSet> } | undefined
const emailsSchema = z.array(z.email()).min(1).max(2)

function configuration(env: AccessSettings) {
  const domain = env.ACCESS_TEAM_DOMAIN
  const audience = env.ACCESS_AUD
  let emails: unknown
  try { emails = JSON.parse(env.ACCESS_ALLOWED_EMAILS ?? '') } catch { return null }
  const allowedEmails = emailsSchema.safeParse(emails)
  if (!domain || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) ||
      !audience || !/^[a-f0-9]{64}$/i.test(audience) ||
      !allowedEmails.success) return null
  return { domain, audience, allowedEmails: allowedEmails.data.map((email) => email.toLowerCase()) }
}

function remoteKeys(domain: string) {
  if (cachedKeys?.domain !== domain) {
    cachedKeys = { domain, keys: createRemoteJWKSet(new URL(`${domain}/cdn-cgi/access/certs`), {
      timeoutDuration: 3000, cacheMaxAge: 600_000,
    }) }
  }
  return cachedKeys.keys
}

// El resolver inyectable se usa solo en pruebas con claves sintéticas; el Worker usa JWKS de Access.
export async function verifyAccess(request: Request, env: AccessSettings,
  keys?: JWTVerifyGetKey): Promise<AccessResult> {
  const config = configuration(env)
  if (!config) return { ok: false, code: 'ACCESS_NOT_CONFIGURED' }
  const token = request.headers.get('cf-access-jwt-assertion')
  if (!token) return { ok: false, code: 'ACCESS_TOKEN_MISSING' }
  try {
    const { payload, protectedHeader } = await jwtVerify(token, keys ?? remoteKeys(config.domain), {
      issuer: config.domain,
      audience: config.audience,
      algorithms: ['RS256'],
      clockTolerance: '5s',
      requiredClaims: ['exp', 'nbf', 'iat', 'email'],
    })
    const now = Math.floor(Date.now() / 1000)
    if (protectedHeader.alg !== 'RS256' || payload.type !== 'app' ||
        typeof payload.email !== 'string' || !config.allowedEmails.includes(payload.email.toLowerCase()) ||
        typeof payload.iat !== 'number' || payload.iat > now + 5 ||
        typeof payload.exp !== 'number' || payload.exp <= payload.iat) {
      return { ok: false, code: 'ACCESS_DENIED' }
    }
    return { ok: true }
  } catch {
    // No devolver errores de JWT, cabeceras, correo o material de claves al cliente.
    return { ok: false, code: 'ACCESS_DENIED' }
  }
}
