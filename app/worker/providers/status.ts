import type { TransportError } from './transport.js'

export async function isCircuitOpen(db: D1Database, provider: string, capability: string,
  nowMs: number): Promise<boolean> {
  const row = await db.prepare('SELECT open_until FROM provider_status WHERE provider=? AND capability=?')
    .bind(provider, capability).first<{ open_until: number | null }>()
  return row?.open_until != null && row.open_until > nowMs
}

export async function noteSuccess(db: D1Database, provider: string, capability: string): Promise<void> {
  await db.prepare(`INSERT INTO provider_status(provider,capability,failure_count,open_until,last_error_code)
    VALUES(?,?,0,NULL,NULL) ON CONFLICT(provider,capability) DO UPDATE SET
    failure_count=0,open_until=NULL,last_error_code=NULL`).bind(provider, capability).run()
}

export async function noteFailure(db: D1Database, provider: string, capability: string,
  code: TransportError, nowMs: number, retryAfterMs: number | null): Promise<void> {
  const hardStop = code === 'PLAN_DENIED' ? nowMs + 86_400_000 :
    code === 'RATE_LIMITED' ? nowMs + (retryAfterMs ?? 60_000) : null
  await db.prepare(`INSERT INTO provider_status
    (provider,capability,failure_count,open_until,last_error_code)
    VALUES(?,?,1,?,?) ON CONFLICT(provider,capability) DO UPDATE SET
    failure_count=provider_status.failure_count+1,
    open_until=CASE WHEN excluded.open_until IS NOT NULL THEN excluded.open_until
      WHEN provider_status.failure_count+1 >= 3 THEN ? ELSE NULL END,
    last_error_code=excluded.last_error_code`)
    .bind(provider, capability, hardStop, code, nowMs + 60_000).run()
}
