import type { z } from 'zod'
import { dataBlockSchema } from '../../shared/contracts/blocks.js'
import type { DataBlock } from '../../shared/contracts/blocks.js'
import type { ProviderContext } from '../providers/types.js'

export function emptyBlock<T>(requestId: string, reasonCode = 'NO_APPROVED_PROVIDER'): DataBlock<T> {
  return { status: 'unavailable', data: null, provenance: [], servedAt: new Date().toISOString(),
    fromCache: false, cacheAgeSeconds: null, nextAllowedRefreshAt: null, warnings: [], reasonCode, requestId }
}

// A lo sumo una alternativa, con el mismo plazo y cancelación que la primaria.
export async function loadProviderBlock<T extends z.ZodType>(schema: T,
  calls: ((context: ProviderContext) => Promise<DataBlock<z.infer<T>>>)[], context: ProviderContext,
): Promise<DataBlock<z.infer<T>>> {
  const signal = AbortSignal.any([context.signal, AbortSignal.timeout(20_000)])
  let last = emptyBlock<z.infer<T>>(context.requestId)
  for (const call of calls.slice(0, 2)) {
    if (signal.aborted) return { ...last, status: 'error', data: null, provenance: [],
      fromCache: false, cacheAgeSeconds: null, reasonCode: context.signal.aborted ? 'ABORTED' : 'TIMEOUT' }
    try {
      let abort: () => void = () => {}
      const cancelled = new Promise<never>((_, reject) => {
        abort = () => reject(new Error('ABORTED'))
        signal.addEventListener('abort', abort, { once: true })
      })
      let result: DataBlock<z.infer<T>>
      try { result = await Promise.race([call({ ...context, signal }), cancelled]) }
      finally { signal.removeEventListener('abort', abort) }
      const block = dataBlockSchema(schema).parse(result)
      last = { ...block, requestId: context.requestId, servedAt: new Date().toISOString() }
      if (block.data !== null || block.status === 'rate_limited') return last
    } catch {
      last = { ...emptyBlock<z.infer<T>>(context.requestId,
        signal.aborted ? (context.signal.aborted ? 'ABORTED' : 'TIMEOUT') : 'INVALID_PROVIDER_RESPONSE'), status: 'error' }
    }
  }
  return last
}
