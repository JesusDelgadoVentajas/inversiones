import { z } from 'zod'
import { stableId, utcInstant } from './primitives.js'

export const apiErrorSchema = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{1,79}$/),
  message: z.string().min(1).max(240),
  requestId: stableId,
  at: utcInstant,
  retryable: z.boolean(),
})

export type ApiError = z.infer<typeof apiErrorSchema>
