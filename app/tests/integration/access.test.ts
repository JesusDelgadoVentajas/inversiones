import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { verifyAccess } from '../../worker/auth/access.js'
import worker from '../../worker/index.js'

const domain = 'https://test-team.cloudflareaccess.com'
const audience = 'a'.repeat(64)
const settings = { ACCESS_TEAM_DOMAIN: domain, ACCESS_AUD: audience,
  ACCESS_OWNER_EMAIL: 'owner@example.org' }
let privateKey: CryptoKey
let keys: ReturnType<typeof createLocalJWKSet>
let jwk: Awaited<ReturnType<typeof exportJWK>>

beforeAll(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  const publicKey = await exportJWK(pair.publicKey)
  jwk = { ...publicKey, alg: 'RS256', kid: 'key-1' }
  keys = createLocalJWKSet({ keys: [jwk] })
})

async function token(claims: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ email: 'owner@example.org', type: 'app', ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: 'key-1' })
    .setIssuer(domain).setAudience(audience)
    .setIssuedAt(now).setNotBefore(now - 1).setExpirationTime(now + 600)
    .sign(privateKey)
}

function request(value?: string) {
  return new Request('https://local.test/api/v1/capabilities', {
    headers: value ? { 'cf-access-jwt-assertion': value } : {},
  })
}

describe('Access local sin red ni credenciales reales', () => {
  it('rechaza configuración ausente o un host de claves arbitrario antes de consultar la red', async () => {
    expect(await verifyAccess(request(), {}, keys)).toEqual({ ok: false, code: 'ACCESS_NOT_CONFIGURED' })
    expect(await verifyAccess(request(), { ...settings,
      ACCESS_TEAM_DOMAIN: 'https://attacker.example.org' }, keys)).toEqual({
      ok: false, code: 'ACCESS_NOT_CONFIGURED',
    })
    expect(await verifyAccess(request(), settings, keys)).toEqual({
      ok: false, code: 'ACCESS_TOKEN_MISSING',
    })
  })

  it('acepta solo firma, emisor, audiencia y correo del propietario', async () => {
    const valid = await token()
    expect(await verifyAccess(request(valid), settings, keys)).toEqual({ ok: true })
    expect(await verifyAccess(request(valid), { ...settings, ACCESS_AUD: 'b'.repeat(64) }, keys))
      .toEqual({ ok: false, code: 'ACCESS_DENIED' })
    expect(await verifyAccess(request(valid), { ...settings,
      ACCESS_TEAM_DOMAIN: 'https://other-team.cloudflareaccess.com' }, keys))
      .toEqual({ ok: false, code: 'ACCESS_DENIED' })
    expect(await verifyAccess(request(valid), { ...settings,
      ACCESS_OWNER_EMAIL: 'other@example.org' }, keys)).toEqual({ ok: false, code: 'ACCESS_DENIED' })
    const parts = valid.split('.')
    const modified = `${parts[0]}.${parts[1]}.${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`
    expect(await verifyAccess(request(modified), settings, keys)).toEqual({
      ok: false, code: 'ACCESS_DENIED',
    })
  })

  it('rechaza caducidad, comienzo futuro y token de servicio sin identidad', async () => {
    const now = Math.floor(Date.now() / 1000)
    const expired = await new SignJWT({ email: 'owner@example.org', type: 'app' })
      .setProtectedHeader({ alg: 'RS256', kid: 'key-1' }).setIssuer(domain).setAudience(audience)
      .setIssuedAt(now - 120).setNotBefore(now - 120).setExpirationTime(now - 60).sign(privateKey)
    const future = await new SignJWT({ email: 'owner@example.org', type: 'app' })
      .setProtectedHeader({ alg: 'RS256', kid: 'key-1' }).setIssuer(domain).setAudience(audience)
      .setIssuedAt(now).setNotBefore(now + 60).setExpirationTime(now + 600).sign(privateKey)
    expect(await verifyAccess(request(expired), settings, keys)).toEqual({
      ok: false, code: 'ACCESS_DENIED',
    })
    expect(await verifyAccess(request(future), settings, keys)).toEqual({
      ok: false, code: 'ACCESS_DENIED',
    })
    expect(await verifyAccess(request(await token({ email: undefined })), settings, keys)).toEqual({
      ok: false, code: 'ACCESS_DENIED',
    })
    expect(await verifyAccess(request(await token({ type: 'org' })), settings, keys)).toEqual({
      ok: false, code: 'ACCESS_DENIED',
    })
  })

  it('admite otra clave pública válida tras rotación sin confiar en el kid por sí solo', async () => {
    const pair = await generateKeyPair('RS256')
    const rotated = await exportJWK(pair.publicKey)
    const rotatingKeys = createLocalJWKSet({ keys: [
      { ...(await exportJWK((await generateKeyPair('RS256')).publicKey)), alg: 'RS256', kid: 'old' },
      { ...rotated, alg: 'RS256', kid: 'new' },
    ] })
    const now = Math.floor(Date.now() / 1000)
    const rotatedToken = await new SignJWT({ email: 'owner@example.org', type: 'app' })
      .setProtectedHeader({ alg: 'RS256', kid: 'new' }).setIssuer(domain).setAudience(audience)
      .setIssuedAt(now).setNotBefore(now).setExpirationTime(now + 600).sign(pair.privateKey)
    expect(await verifyAccess(request(rotatedToken), settings, rotatingKeys)).toEqual({ ok: true })
    expect(await verifyAccess(request(rotatedToken), settings, keys)).toEqual({
      ok: false, code: 'ACCESS_DENIED',
    })
  })

  it('verifica JWKS y JWT en la ruta real antes de declarar los datos no listos', async () => {
    const mockedFetch = vi.fn(async () => Response.json({ keys: [jwk] }))
    vi.stubGlobal('fetch', mockedFetch)
    try {
      const response = await worker.fetch(new Request('https://local.test/api/v1/capabilities', {
        headers: { 'cf-access-jwt-assertion': await token() },
      }), {
        ...settings, APP_READY: 'false', ALLOW_LIVE_PROVIDERS: 'false',
      } as Env)
      expect(response.status).toBe(503)
      expect(await response.json()).toMatchObject({ code: 'APP_NOT_READY' })
      expect(mockedFetch).toHaveBeenCalledTimes(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
