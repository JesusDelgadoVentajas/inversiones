import { useEffect, useRef, useState } from 'react'
import type { z } from 'zod'
import type { DataBlock } from '../../shared/contracts/blocks.js'
import { errorMessage, isSessionFailure, readApi } from '../api.js'

export function useDataBlock<T>(path: string, schema: z.ZodType<DataBlock<T>>, intervalMs = 0) {
  const [state, setState] = useState<{ path: string; block: DataBlock<T> | null; loading: boolean;
    error: string | null; refreshBlocked: boolean; sessionRequired: boolean }>({ path, block: null, loading: true,
      error: null, refreshBlocked: false, sessionRequired: false })
  const refresh = useRef<() => void>(() => {})
  useEffect(() => {
    let active = true
    let controller: AbortController | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let unlockTimer: ReturnType<typeof setTimeout> | undefined
    let nextAllowed = 0
    let loaded = false
    let sequence = 0
    let sessionExpired = false
    const schedule = () => {
      if (intervalMs > 0 && active && !sessionExpired && !document.hidden) timer = setTimeout(() => { void load() },
        Math.max(intervalMs, nextAllowed - Date.now()))
    }
    const load = async () => {
      if (!active || sessionExpired || document.hidden || Date.now() < nextAllowed) return
      clearTimeout(timer)
      controller?.abort()
      const request = new AbortController()
      controller = request
      const id = ++sequence
      setState((previous) => ({ ...previous, path, block: previous.path === path ? previous.block : null,
        loading: true, error: null }))
      try {
        const result = await readApi(path, schema, request.signal)
        if (!active || request.signal.aborted || id !== sequence) return
        nextAllowed = result.nextAllowedRefreshAt ? Date.parse(result.nextAllowedRefreshAt) : 0
        loaded = true
        clearTimeout(unlockTimer)
        const refreshBlocked = nextAllowed > Date.now()
        setState({ path, block: result, loading: false, error: null, refreshBlocked, sessionRequired: false })
        if (refreshBlocked) unlockTimer = setTimeout(() => {
          if (active) setState((previous) => ({ ...previous, refreshBlocked: false }))
        }, Math.min(nextAllowed - Date.now(), 2_147_483_647))
      } catch (reason) {
        if (!active || request.signal.aborted || id !== sequence) return
        sessionExpired = isSessionFailure(reason)
        setState((previous) => ({ ...previous, loading: false, error: errorMessage(reason), sessionRequired: sessionExpired,
          block: previous.block?.data != null ? { ...previous.block, status: 'stale', reasonCode: 'REFRESH_FAILED' } : previous.block }))
      } finally {
        if (active && !request.signal.aborted && id === sequence) schedule()
      }
    }
    const visibility = () => {
      clearTimeout(timer)
      if (document.hidden) { controller?.abort(); setState((previous) => ({ ...previous, loading: false })) }
      else if (intervalMs > 0 || !loaded) {
        if (Date.now() >= nextAllowed) void load()
        else schedule()
      }
    }
    refresh.current = () => { void load() }
    document.addEventListener('visibilitychange', visibility)
    void load()
    return () => {
      active = false
      controller?.abort()
      clearTimeout(timer)
      clearTimeout(unlockTimer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [path, schema, intervalMs])
  const current = state.path === path ? state : { block: null, loading: true, error: null, refreshBlocked: false, sessionRequired: false }
  return { ...current, refresh: () => refresh.current() }
}
