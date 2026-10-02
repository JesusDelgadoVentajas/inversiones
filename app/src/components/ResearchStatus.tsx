import type { DataBlock } from '../../shared/contracts/blocks.js'
import { blockMessage } from '../api.js'
import { instant } from '../format.js'

export function ResearchStatus({ block, loading, error, sessionRequired, path }: {
  block: DataBlock<unknown> | null; loading: boolean; error: string | null; sessionRequired: boolean; path: string
}) {
  return <>
    <div role="status" aria-live="polite">{loading && <p>Comprobando información…</p>}{error && <p>{error}</p>}</div>
    {sessionRequired && <a href={path}>Volver a iniciar sesión</a>}
    {block?.status === 'stale' && <p className="notice">Información guardada: no se ha podido comprobar una versión más reciente.</p>}
    {block && block.data === null && <p>{blockMessage(block.reasonCode)}</p>}
    {block?.warnings.map((warning) => <p className="notice" key={warning}>{warning}</p>)}
    {block?.nextAllowedRefreshAt && <p>Próxima comprobación permitida: {instant(block.nextAllowedRefreshAt, 'UTC')}</p>}
  </>
}
