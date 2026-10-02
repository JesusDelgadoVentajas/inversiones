import { reserveProviderCall } from './budget.js'
import type { BudgetRequest } from './budget.js'
import { acquireProviderSlot, releaseProviderSlot } from './concurrency.js'
import { isCircuitOpen, noteFailure, noteSuccess } from './status.js'
import type { TransportResult } from './transport.js'

type Result<T> = { ok: true; data: T; attempts: number } |
  { ok: false; code: string; attempts: number }

export async function executeProvider<T>(options: {
  db: D1Database | undefined
  requestId: string
  provider: string
  capability: string
  budget: BudgetRequest
  request: (limits: { timeoutMs: number; signal: AbortSignal }) => Promise<TransportResult<T>>
  totalTimeoutMs?: number
  maxConcurrency?: number
  signal?: AbortSignal
  pause?: () => Promise<void>
  trace?: (entry: { requestId: string; provider: string; capability: string;
    status: string; attempts: number; durationMs: number }) => void
}): Promise<Result<T>> {
  const { db, requestId, provider, capability, budget, request,
    totalTimeoutMs = 20_000, maxConcurrency = 3,
    pause = () => new Promise((resolve) => setTimeout(resolve, 250)),
    trace = (entry) => console.info(JSON.stringify(entry)) } = options
  if (!Number.isInteger(totalTimeoutMs) || totalTimeoutMs < 1 || totalTimeoutMs > 20_000) {
    throw new Error('Plazo total inválido.')
  }
  const started = performance.now()
  const deadline = AbortSignal.timeout(totalTimeoutMs)
  const totalSignal = options.signal ? AbortSignal.any([deadline, options.signal]) : deadline
  let attempts = 0
  const finish = (status: string, result: Result<T>) => {
    try { trace({ requestId, provider, capability, status, attempts,
      durationMs: Math.round(performance.now() - started) }) }
    catch { /* Un fallo del registro no altera el estado ni revela datos externos. */ }
    return result
  }
  if (!db) return finish('STORAGE_UNAVAILABLE', { ok: false, code: 'STORAGE_UNAVAILABLE', attempts })
  if (options.signal?.aborted) return finish('ABORTED', { ok: false, code: 'ABORTED', attempts })
  try {
    if (await isCircuitOpen(db, provider, capability, budget.nowMs)) {
      return finish('CIRCUIT_OPEN', { ok: false, code: 'CIRCUIT_OPEN', attempts })
    }
    for (let iteration = 0; iteration < 2; iteration += 1) {
      if (totalSignal.aborted || performance.now() - started >= totalTimeoutMs) {
        const code = options.signal?.aborted ? 'ABORTED' : 'TIMEOUT'
        return finish(code, { ok: false, code, attempts })
      }
      const nowMs = budget.nowMs + Math.round(performance.now() - started)
      const ownerId = crypto.randomUUID()
      const slot = await acquireProviderSlot(db, provider, ownerId, nowMs, maxConcurrency)
      if (slot === null) {
        return finish('CONCURRENCY_LIMITED', { ok: false, code: 'CONCURRENCY_LIMITED', attempts })
      }
      let response: TransportResult<T>
      try {
        const reservation = await reserveProviderCall(db, { ...budget, nowMs })
        if (!reservation.allowed) {
          return finish(reservation.reason, { ok: false, code: reservation.reason, attempts })
        }
        if (totalSignal.aborted) {
          const code = options.signal?.aborted ? 'ABORTED' : 'TIMEOUT'
          return finish(code, { ok: false, code, attempts })
        }
        attempts += 1
        try { response = await request({ timeoutMs: Math.min(8000,
          Math.max(1, totalTimeoutMs - Math.round(performance.now() - started))),
        signal: totalSignal }) }
        catch { response = { ok: false, code: 'NETWORK', retryAfterMs: null } }
      } finally {
        await releaseProviderSlot(db, provider, slot, ownerId)
      }
      if (totalSignal.aborted || !response.ok && response.code === 'ABORTED') {
        const code = options.signal?.aborted ? 'ABORTED' : deadline.aborted ? 'TIMEOUT' : 'ABORTED'
        return finish(code, { ok: false, code, attempts })
      }
      if (response.ok) {
        await noteSuccess(db, provider, capability)
        return finish('OK', { ok: true, data: response.data, attempts })
      }
      await noteFailure(db, provider, capability, response.code, nowMs, response.retryAfterMs)
      if (await isCircuitOpen(db, provider, capability, nowMs) &&
          ['NETWORK', 'TIMEOUT', 'UPSTREAM_ERROR'].includes(response.code)) {
        return finish('CIRCUIT_OPEN', { ok: false, code: 'CIRCUIT_OPEN', attempts })
      }
      if (iteration === 0 && ['NETWORK', 'TIMEOUT', 'UPSTREAM_ERROR'].includes(response.code) &&
          performance.now() - started < totalTimeoutMs - 250) {
        await pause()
        continue
      }
      return finish(response.code, { ok: false, code: response.code, attempts })
    }
  } catch {
    return finish('STORAGE_UNAVAILABLE', { ok: false, code: 'STORAGE_UNAVAILABLE', attempts })
  }
  return finish('TIMEOUT', { ok: false, code: 'TIMEOUT', attempts })
}
