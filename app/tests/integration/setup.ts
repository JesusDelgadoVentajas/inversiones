import { env } from 'cloudflare:workers'
import { applyD1Migrations } from 'cloudflare:test'
import type { D1Migration } from 'cloudflare:test'

const bindings = env as Env & { TEST_MIGRATIONS?: D1Migration[] }
if (!bindings.DB || !bindings.TEST_MIGRATIONS) throw new Error('Falta D1 local de pruebas.')
await applyD1Migrations(bindings.DB, bindings.TEST_MIGRATIONS)
