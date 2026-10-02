export type BudgetScope = 'production' | 'staging' | 'manual'
export type BudgetReason = 'RATE_LIMITED' | 'STORAGE_UNAVAILABLE' | 'CONFIGURATION_MISMATCH'
export type BudgetResult = { allowed: true } | { allowed: false; reason: BudgetReason }

export function allocateBudget(total: number) {
  if (!Number.isSafeInteger(total) || total < 0) throw new Error('Límite contractual inválido.')
  const production = Math.floor(total * 0.50)
  const staging = Math.floor(total * 0.15)
  const manual = Math.floor(total * 0.05)
  return { production, staging, manual, reserve: total - production - staging - manual }
}

export interface BudgetWindow { seconds: number; cap: number }
export interface BudgetRequest {
  provider: string
  scope: BudgetScope
  windows: BudgetWindow[]
  nowMs: number
}

// D1.batch ejecuta las ventanas como transacción; el CHECK used<=cap hace rollback
// de toda la reserva si cualquiera de ellas está agotada.
export async function reserveProviderCall(db: D1Database | undefined, input: BudgetRequest): Promise<BudgetResult> {
  if (!db) return { allowed: false, reason: 'STORAGE_UNAVAILABLE' }
  if (!/^[a-z][a-z0-9_-]{1,39}$/.test(input.provider) ||
      !['production', 'staging', 'manual'].includes(input.scope) ||
      !Number.isSafeInteger(input.nowMs) || input.nowMs < 0 ||
      input.windows.length === 0 || input.windows.some((window) =>
        !Number.isSafeInteger(window.seconds) || window.seconds < 1 ||
        !Number.isSafeInteger(window.cap) || window.cap < 1) ||
      new Set(input.windows.map((window) => window.seconds)).size !== input.windows.length) {
    return { allowed: false, reason: 'CONFIGURATION_MISMATCH' }
  }
  try {
    const statements = input.windows.map(({ seconds, cap }) => {
      const start = Math.floor(input.nowMs / 1000 / seconds) * seconds
      return db.prepare(`INSERT INTO provider_budgets
        (provider,scope,window_start,window_seconds,cap,used) VALUES(?,?,?,?,?,1)
        ON CONFLICT(provider,scope,window_start,window_seconds) DO UPDATE SET
        used = CASE WHEN cap=excluded.cap THEN used+1 ELSE cap+1 END`)
        .bind(input.provider, input.scope, start, seconds, cap)
    })
    await db.batch(statements)
    return { allowed: true }
  } catch {
    try {
      for (const { seconds, cap } of input.windows) {
        const start = Math.floor(input.nowMs / 1000 / seconds) * seconds
        const row = await db.prepare(`SELECT used, cap FROM provider_budgets
          WHERE provider=? AND scope=? AND window_start=? AND window_seconds=?`)
          .bind(input.provider, input.scope, start, seconds).first<{ used: number; cap: number }>()
        if (row && row.cap !== cap) return { allowed: false, reason: 'CONFIGURATION_MISMATCH' }
        if (row && row.used >= cap) return { allowed: false, reason: 'RATE_LIMITED' }
      }
    } catch { /* No se puede diagnosticar un fallo de D1: cerrar acceso. */ }
    return { allowed: false, reason: 'STORAGE_UNAVAILABLE' }
  }
}
