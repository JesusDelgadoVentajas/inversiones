import { dataBlockSchema } from '../../shared/contracts/blocks.js'
import { quoteSchema } from '../../shared/contracts/financial.js'
import type { Listing } from '../../shared/contracts/identity.js'
import { priceChange } from '../../shared/finance/price-change.js'
import { blockMessage } from '../api.js'
import { amount, instant } from '../format.js'
import { useDataBlock } from '../hooks/use-data-block.js'

const schema = dataBlockSchema(quoteSchema)
const sessions = { regular: 'Sesión regular', pre_market: 'Antes de apertura',
  after_hours: 'Después del cierre', closed: 'Mercado cerrado', unknown: 'Sesión desconocida' }

export function QuotePanel({ listing }: { listing: Listing }) {
  const { block, loading, error, refresh, refreshBlocked, sessionRequired } = useDataBlock(`/api/v1/listings/${listing.id}/quote`, schema, 30_000)
  const quote = block?.data
  const change = quote ? priceChange(quote) : null
  return <section className="data-panel" aria-labelledby="quote-title">
    <div className="panel-heading"><h2 id="quote-title">Precio</h2>
      <button onClick={refresh} disabled={loading || refreshBlocked || sessionRequired}>Actualizar precio</button></div>
    <div role="status" aria-live="polite">{loading && <p>Comprobando precio…</p>}{error && <p>{error}</p>}</div>
    {sessionRequired && <a href={`/listings/${listing.id}`}>Volver a iniciar sesión</a>}
    {block?.status === 'stale' && <p className="notice">Dato guardado: no se ha podido comprobar si hay un precio más reciente.</p>}
    {quote ? <>
      <p className="quote-value">{amount(quote.price)} <span>{quote.unit.unit} · {quote.unit.currency}</span></p>
      {!/^1(?:\.0+)?$/.test(quote.unit.unitToMajor) && <p>Una unidad cotizada equivale a {amount(quote.unit.unitToMajor)} {quote.unit.currency}.</p>}
      <p>{change?.available ? `Variación respecto al cierre anterior: ${amount(change.absolute)} ${quote.unit.unit} (${amount(change.percent)} %).` :
        'Variación no disponible: falta un cierre anterior compatible y verificado.'}</p>
      <p>{sessions[quote.session]}{listing.status === 'suspended' ? ' · Instrumento suspendido' : ''}</p>
      <p>Observado: <time dateTime={quote.observedAt}>{instant(quote.observedAt, listing.timeZone)}</time></p>
      <p>Fuente: {block?.provenance.map((source) => source.provider).join(', ')} · Feed: {quote.feed}</p>
      <p>{quote.coverage}</p>
      <p>Comprobado: {block?.provenance.map((source) => instant(source.checkedAt, 'UTC')).join(', ')}</p>
      {quote.previousClose && <p>Cierre anterior aportado por la fuente: {amount(quote.previousClose.price)} {quote.previousClose.unit.unit},
        {' '}{instant(quote.previousClose.observedAt, listing.timeZone)}. Fórmula: (precio / cierre anterior − 1) × 100.</p>}
    </> : block && <p>{blockMessage(block.reasonCode)}</p>}
    {block?.warnings.map((warning) => <p className="notice" key={warning}>{warning}</p>)}
    {refreshBlocked && block?.nextAllowedRefreshAt && <p>Próxima comprobación permitida: {instant(block.nextAllowedRefreshAt, 'UTC')}</p>}
  </section>
}
