import { useState } from 'react'
import { dataBlockSchema } from '../../shared/contracts/blocks.js'
import { historySchema } from '../../shared/contracts/financial.js'
import type { PriceHistory, PriceRange } from '../../shared/contracts/financial.js'
import type { Listing } from '../../shared/contracts/identity.js'
import { blockMessage } from '../api.js'
import { amount, instant } from '../format.js'
import { useDataBlock } from '../hooks/use-data-block.js'

const schema = dataBlockSchema(historySchema)
const ranges: Record<PriceRange, string> = { '1m': '1 mes', '3m': '3 meses', '1y': '1 año', '5y': '5 años', max: 'Máximo' }
const adjustments = { raw: 'Sin ajustar', split_adjusted: 'Ajustado por splits', total_return: 'Rentabilidad total' }
const resolutions = { minute: 'Por minuto', hour: 'Por hora', day: 'Diario', week: 'Semanal', month: 'Mensual' }

function PriceChart({ history, timeZone }: { history: PriceHistory; timeZone: string | null }) {
  const values = history.bars.map((bar) => Number(bar.close))
  if (values.some((value) => !Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER)) {
    return <p>La magnitud de estos precios requiere consultar la tabla para conservar la precisión.</p>
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const first = Date.parse(history.bars[0].startsAt)
  const last = Date.parse(history.bars[history.bars.length - 1].startsAt)
  return <figure className="price-chart">
    <div className="chart-labels"><span>Mínimo: {amount(history.bars[values.indexOf(min)].close)}</span>
      <span>Máximo: {amount(history.bars[values.indexOf(max)].close)} {history.unit.unit}</span></div>
    <svg viewBox="0 0 600 240" role="img" aria-labelledby="chart-title chart-description">
      <title id="chart-title">Cierres históricos en {history.unit.unit}</title>
      <desc id="chart-description">Cada punto representa una barra recibida. No se añaden puntos en fechas sin datos. Los valores exactos están en la tabla.</desc>
      <line x1="30" y1="210" x2="570" y2="210" stroke="currentColor" opacity=".3" />
      {history.bars.map((bar, index) => <circle key={bar.startsAt}
        cx={30 + (last === first ? .5 : (Date.parse(bar.startsAt) - first) / (last - first)) * 540}
        cy={210 - (max === min ? .5 : (values[index] - min) / (max - min)) * 180} r="3" fill="currentColor">
        <title>{bar.startsAt}: {amount(bar.close)} {history.unit.unit}</title>
      </circle>)}
    </svg>
    <figcaption>{history.bars.length} barras recibidas · {resolutions[history.resolution]} · {adjustments[history.adjustment]} · {history.unit.unit} / {history.unit.currency}.
      {' '}Desde {instant(history.bars[0].startsAt, timeZone)} hasta {instant(history.bars[history.bars.length - 1].startsAt, timeZone)}.
      {' '}La posición de los puntos es aproximada; la tabla conserva los valores exactos.</figcaption>
  </figure>
}

function PriceTable({ history, timeZone }: { history: PriceHistory; timeZone: string | null }) {
  const [requestedPage, setPage] = useState(0)
  const page = Math.min(requestedPage, Math.ceil(history.bars.length / 20) - 1)
  const bars = history.bars.slice(page * 20, (page + 1) * 20)
  return <details><summary>Ver los valores en una tabla</summary>
    <div className="table-scroll"><table><caption>Cierres recibidos en {history.unit.unit}, {adjustments[history.adjustment].toLowerCase()}</caption>
      <thead><tr><th scope="col">Inicio de la barra</th><th scope="col">Cierre</th><th scope="col">Fuente</th></tr></thead>
      <tbody>{bars.map((bar) => <tr key={bar.startsAt}><th scope="row">{instant(bar.startsAt, timeZone)}</th>
        <td>{amount(bar.close)}</td><td>{bar.provenance.provider}</td></tr>)}</tbody>
    </table></div>
    <div className="table-pages"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
      <span>Página {page + 1} de {Math.ceil(history.bars.length / 20)}</span>
      <button disabled={(page + 1) * 20 >= history.bars.length} onClick={() => setPage(page + 1)}>Siguiente</button></div>
  </details>
}

export function HistoryPanel({ listing }: { listing: Listing }) {
  const [range, setRange] = useState<PriceRange>('1y')
  const { block, loading, error, refresh, refreshBlocked, sessionRequired } = useDataBlock(`/api/v1/listings/${listing.id}/prices?range=${range}`, schema)
  return <section className="data-panel" aria-labelledby="history-title">
    <div className="panel-heading"><h2 id="history-title">Histórico</h2>
      <button disabled={loading || refreshBlocked || sessionRequired} onClick={refresh}>Actualizar histórico</button></div>
    <label htmlFor="price-range">Periodo</label>
    <select id="price-range" value={range} onChange={(event) => setRange(event.target.value as PriceRange)}>
      {(Object.keys(ranges) as PriceRange[]).map((value) => <option key={value} value={value}
        disabled={block?.data ? !block.data.availableRanges.includes(value) : false}>{ranges[value]}</option>)}
    </select>
    <div role="status" aria-live="polite">{loading && <p>Comprobando histórico…</p>}{error && <p>{error}</p>}</div>
    {sessionRequired && <a href={`/listings/${listing.id}`}>Volver a iniciar sesión</a>}
    {block?.status === 'stale' && <p className="notice">Histórico guardado sin comprobar novedades o correcciones.</p>}
    {block?.data ? <>
      <PriceChart history={block.data} timeZone={listing.timeZone} />
      <p>Fuente: {block.provenance.map((source) => source.provider).join(', ')} · Feed: {block.data.feed}.</p>
      <p>Comprobado: {block.provenance.map((source) => instant(source.checkedAt, 'UTC')).join(', ')}</p>
      <PriceTable key={range} history={block.data} timeZone={listing.timeZone} />
    </> : block && <p>{blockMessage(block.reasonCode)}</p>}
    {block?.warnings.map((warning) => <p className="notice" key={warning}>{warning}</p>)}
  </section>
}
