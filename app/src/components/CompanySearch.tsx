import { useEffect, useRef, useState } from 'react'
import { dataBlockSchema } from '../../shared/contracts/blocks.js'
import type { DataBlock } from '../../shared/contracts/blocks.js'
import { searchCandidateSchema, searchQuerySchema } from '../../shared/contracts/search.js'
import type { SearchCandidate } from '../../shared/contracts/search.js'
import { blockMessage, errorMessage, readApi } from '../api.js'
import { instrumentLabel } from '../format.js'

const responseSchema = dataBlockSchema(searchCandidateSchema.array().max(20))

export function CompanySearch({ enabled }: { enabled: boolean }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<DataBlock<SearchCandidate[]> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const sequence = useRef(0)
  const results = useRef<HTMLUListElement>(null)
  const changeQuery = (value: string) => {
    sequence.current += 1
    setQuery(value)
    setResult(null)
    setError(null)
    setLoading(false)
  }
  useEffect(() => {
    const id = ++sequence.current
    const controller = new AbortController()
    const parsed = searchQuerySchema.safeParse(query)
    if (!enabled || !parsed.success) return () => controller.abort()
    const timer = setTimeout(() => {
      setLoading(true)
      readApi(`/api/v1/search?q=${encodeURIComponent(parsed.data)}`, responseSchema, controller.signal)
        .then((block) => { if (sequence.current === id && !controller.signal.aborted) setResult(block) })
        .catch((reason: unknown) => { if (sequence.current === id && !controller.signal.aborted) setError(errorMessage(reason)) })
        .finally(() => { if (sequence.current === id && !controller.signal.aborted) setLoading(false) })
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, enabled])
  return <section className="search-panel" aria-labelledby="search-title">
    <h2 id="search-title">Busca una empresa</h2>
    <label htmlFor="company-name">Nombre de la empresa</label>
    <input id="company-name" type="search" value={query} disabled={!enabled} autoComplete="off"
      maxLength={160} placeholder="Por ejemplo, el nombre de una empresa cotizada"
      aria-describedby="search-help" aria-controls="company-results"
      onChange={(event) => changeQuery(event.target.value)} onKeyDown={(event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); results.current?.querySelector<HTMLAnchorElement>('a')?.focus() }
        if (event.key === 'Escape') changeQuery('')
      }} />
    <p id="search-help">{enabled ? 'Escribe entre 2 y 80 caracteres. Selecciona el mercado y la clase que te interesen.' :
      'La búsqueda se activará cuando las fuentes y el acceso personal estén comprobados.'}</p>
    <div role="status" aria-live="polite">
      {loading && <p>Buscando…</p>}
      {error && <p>{error}</p>}
      {result?.data?.length === 0 && <p>No encontramos coincidencias en las fuentes consultadas. Prueba otro nombre.</p>}
      {result && result.data === null && <p>{blockMessage(result.reasonCode)}</p>}
      {result?.data && result.data.length > 0 && <p>Selecciona un instrumento. Las bolsas y clases pueden tener precios diferentes.</p>}
      {result?.status === 'stale' && <p className="notice">Resultados guardados: su identidad puede haber cambiado desde la última comprobación.</p>}
      {result?.warnings.map((warning) => <p className="notice" key={warning}>{warning}</p>)}
    </div>
    <ul id="company-results" ref={results} className="search-results">
      {result?.data?.flatMap((candidate) => candidate.listings.map((listing) => <li key={listing.id}>
        <a href={`/listings/${listing.id}`}><strong>{candidate.company.legalName}</strong>
          <span>{candidate.company.country ?? 'País desconocido'} · Mercado {listing.mic} · {listing.currency}</span>
          <span>{instrumentLabel[listing.instrument]}{listing.shareClass ? ` · Clase ${listing.shareClass}` : ''} · {listing.symbol}
            {listing.status !== 'active' ? ` · ${listing.status === 'suspended' ? 'Suspendido' : listing.status === 'delisted' ? 'Excluido de cotización' : 'Estado desconocido'}` : ''}</span>
        </a>
      </li>))}
    </ul>
  </section>
}
