import { z } from 'zod'

export const healthSchema = z.object({ status: z.enum(['preparacion', 'operativa']),
  liveData: z.boolean(), searchAvailable: z.boolean(), message: z.string().min(1).max(500) })

export type HealthResponse = z.infer<typeof healthSchema>
