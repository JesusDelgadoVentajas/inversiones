import { useState } from 'react'
import { dataBlockSchema } from '../../shared/contracts/blocks.js'
import { financialFactSchema, metricSchema } from '../../shared/contracts/financial.js'
import type { Profile } from '../../shared/contracts/search.js'
import { metricCatalog, metricReasons } from '../../shared/finance/metric-catalog.js'
import { financialLabel } from '../../shared/finance/labels.js'
import { amount } from '../format.js'
import { useDataBlock } from '../hooks/use-data-block.js'
import { ResearchStatus } from './ResearchStatus.js'

const schema = dataBlockSchema(metricSchema.array().length(32))
const factsSchema = dataBlockSchema(financialFactSchema.array().max(1000))
const titles = new Map<string, string>(metricCatalog.map(([id, title]) => [id, title]))
const statuses = { available: 'Disponible', unavailable: 'No disponible', stale: 'Dato antiguo',
  not_applicable: 'No aplicable', error: 'Error' }
const unit = (value: string) => value === 'ratio' ? 'veces' : value === 'shares' ? 'acciones' :
  value.replace('/shares', '/acción')

export function FinancialPanel({ profile }: { profile: Profile }) {
  const [category, setCategory] = useState('all')
  const [showFacts, setShowFacts] = useState(false)
  const state = useDataBlock('/api/v1/listings/' + profile.listing.id + '/metrics', schema)
  const metrics = state.block?.data?.filter((metric) => category === 'all' || category === 'available' &&
    metric.value !== null || category === 'missing' && metric.value === null)
  return <section className="data-panel" aria-labelledby="financial-title">
    <div className="panel-heading"><h2 id="financial-title">Cuentas y métricas</h2>
      <button onClick={state.refresh} disabled={state.loading || state.refreshBlocked || state.sessionRequired}>Actualizar métricas</button></div>
    <ResearchStatus {...state} path={'/listings/' + profile.listing.id} />
    {state.block?.data && <>
      <p>{state.block.data.filter((metric) => metric.value !== null).length} de 32 métricas con entradas compatibles.
        Cada cálculo conserva sus unidades, periodos y fuentes.</p>
      <label htmlFor="metric-filter">Mostrar métricas</label>
      <select id="metric-filter" value={category} onChange={(event) => setCategory(event.target.value)}>
        <option value="all">Todas</option><option value="available">Con valor</option><option value="missing">Sin valor</option>
      </select>
      <div className="metric-grid">{metrics?.map((metric) => <article className="metric-card" key={metric.id}>
        <h3>{titles.get(metric.id)}</h3>
        <p className="metric-value">{metric.value === null ? '—' : amount(metric.value) + ' ' + unit(metric.unit)}</p>
        <p>{statuses[metric.status]}{state.block?.status === 'stale' && metric.value !== null ? ' · Comprobación pendiente' : ''}</p>
        {metric.value === null && <p>{metricReasons[metric.reasonCode ?? ''] ?? 'Falta una referencia compatible y verificada.'}</p>}
        {metric.periodEnd && <p>Periodo: {metric.periodStart ? metric.periodStart + ' → ' : ''}{metric.periodEnd}</p>}
        <details><summary>Cómo se calcula</summary><p>{metric.explanation}</p>
          <ul>{metric.inputs.map((input, index) => <li key={input.name + index}>
            {financialLabel(input.name)}: {amount(input.value)} {unit(input.unit)} · {input.periodStart ?? 'Saldo/observación'} → {input.periodEnd}
            <ul>{input.provenance.map((source, sourceIndex) => <li key={sourceIndex}>{source.sourceUrl ?
              <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">{source.provider}</a> : source.provider}
              {' · Comprobado: ' + source.checkedAt}</li>)}</ul>
          </li>)}</ul>
        </details>
      </article>)}</div>
    </>}
    <details onToggle={(event) => setShowFacts(event.currentTarget.open)}>
      <summary>Ver cuentas originales normalizadas</summary>
      {showFacts && <FinancialFacts profile={profile} />}
    </details>
  </section>
}

function FinancialFacts({ profile }: { profile: Profile }) {
  const [page, setPage] = useState(0)
  const state = useDataBlock('/api/v1/companies/' + profile.company.id + '/financials', factsSchema)
  return <>
    <ResearchStatus {...state} path={'/listings/' + profile.listing.id} />
    {state.block?.data && <div className="table-scroll"><table>
      <caption>Hechos publicados y revisiones. Los cálculos eligen versiones y periodos compatibles.</caption>
      <thead><tr><th>Concepto</th><th>Valor y unidad</th><th>Periodo</th><th>Presentación</th><th>Documento</th></tr></thead>
      <tbody>{state.block.data.slice(page * 40, (page + 1) * 40).map((fact, index) => <tr key={index}>
        <th scope="row">{financialLabel(fact.concept)}</th><td>{amount(fact.value)} {unit(fact.unit)}</td>
        <td>{fact.periodStart ? fact.periodStart + ' → ' : 'Saldo a '}{fact.periodEnd}</td>
        <td>{fact.filedAt ?? fact.filedDate}{fact.filedAt === null ? ' · Hora desconocida' : ''}</td>
        <td><a href={fact.documentUrl} target="_blank" rel="noopener noreferrer">{fact.provenance.provider}</a>
          {' · ' + fact.basis}{fact.sourceTag ? ' · ' + fact.sourceTag : ''}</td>
      </tr>)}</tbody>
    </table><div className="table-pages">
      <button disabled={page === 0} onClick={() => setPage((previous) => previous - 1)}>Cuentas anteriores</button>
      <span>Página {page + 1}</span>
      <button disabled={(page + 1) * 40 >= state.block.data.length}
        onClick={() => setPage((previous) => previous + 1)}>Más cuentas</button>
    </div></div>}
  </>
}
