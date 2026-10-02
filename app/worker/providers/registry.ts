import type { ProviderAdapter } from './types.js'

export interface RegisteredProvider {
  adapter: ProviderAdapter
  identityRetentionAllowed: boolean
}

// Se rellena solo después de G-DATOS. Las fuentes sintéticas se inyectan en tests.
export const approvedProviders: readonly RegisteredProvider[] = []
