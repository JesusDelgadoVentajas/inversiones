import { useState } from 'react'
import { dataBlockSchema } from '../../shared/contracts/blocks.js'
import { newsPageSchema } from '../../shared/contracts/context.js'
import { newsLabels } from '../../shared/news/page.js'
import { instant } from '../format.js'
import { useDataBlock } from '../hooks/use-data-block.js'
import { ResearchStatus } from './ResearchStatus.js'

const schema = dataBlockSchema(newsPageSchema)

export function NewsPanel({ companyId, listingId }: { companyId: string; listingId: string }) {
  const [kind, setKind] = useState('all')
  const [pages, setPages] = useState<(string | null)[]>([null])
  const cursor = pages.at(-1) ?? null
  const state = useDataBlock('/api/v1/companies/' + companyId + '/news?kind=' + kind +
    (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''), schema)
  return <section className="data-panel" aria-labelledby="news-title">
    <div className="panel-heading"><h2 id="news-title">Noticias relacionadas</h2>
      <button onClick={state.refresh} disabled={state.loading || state.refreshBlocked || state.sessionRequired}>Actualizar noticias</button></div>
    <p>Fecha original, fuente y motivo de relación con la empresa.</p>
    <p>La lista cubre la ventana disponible en la fuente; puede haber publicaciones anteriores.</p>
    <label htmlFor="news-filter">Tipo de publicación</label>
    <select id="news-filter" value={kind} onChange={(event) => { setKind(event.target.value); setPages([null]) }}>
      <option value="all">Todos los tipos</option>
      {Object.entries(newsLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <ResearchStatus {...state} path={'/listings/' + listingId} />
    {state.block?.data && <>
      {state.block.data.items.length === 0 && <p>No hay publicaciones verificadas para este filtro en la ventana consultada.</p>}
      <ol className="news-list">{state.block.data.items.map((item) => <li key={item.id}>
        <p className="eyebrow">{newsLabels[item.kind]}</p>
        <h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
        <p>{item.source} · {item.dateKind === 'filing' ? 'Fecha de presentación: ' : ''}{item.publishedAt ? instant(item.publishedAt, 'UTC') :
          item.publishedDate + ' · Hora y zona desconocidas'} · {item.language === 'und' ? 'Idioma desconocido' : item.language}</p>
        <p>{item.relationReason}</p>
      </li>)}</ol>
      <div className="table-pages">
        <button disabled={pages.length < 2 || state.loading || state.refreshBlocked}
          onClick={() => setPages((previous) => previous.slice(0, -1))}>Página anterior de noticias</button>
        <span>Página {pages.length}</span>
        <button disabled={!state.block.data.nextCursor || state.loading || state.refreshBlocked}
          onClick={() => { const next = state.block?.data?.nextCursor; if (next) setPages((previous) => [...previous, next]) }}>Ver más noticias</button>
      </div>
    </>}
  </section>
}
