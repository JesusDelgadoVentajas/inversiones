import { useEffect, useState } from 'react'
import { profileSchema } from '../../shared/contracts/search.js'
import type { Profile } from '../../shared/contracts/search.js'
import { readApi, errorMessage } from '../api.js'
import { instant, instrumentLabel } from '../format.js'
import { HistoryPanel } from './HistoryPanel.js'
import { QuotePanel } from './QuotePanel.js'
import { FinancialPanel } from './FinancialPanel.js'
import { NewsPanel } from './NewsPanel.js'

export function ListingPage({ id }: { id: string }) {
  const [tab, setTab] = useState('market')
  const [state, setState] = useState<{ id: string; profile: Profile | null; error: string | null }>({ id, profile: null, error: null })
  const { profile, error } = state.id === id ? state : { profile: null, error: null }
  useEffect(() => {
    const controller = new AbortController()
    readApi(`/api/v1/listings/${encodeURIComponent(id)}/profile`, profileSchema, controller.signal)
      .then((value) => { if (!controller.signal.aborted) setState({ id, profile: value, error: null }) })
      .catch((reason: unknown) => { if (!controller.signal.aborted) setState({ id, profile: null, error: errorMessage(reason) }) })
    return () => controller.abort()
  }, [id])
  return <div className="listing-page">
    <a className="back-link" href="/">← Buscar otra empresa</a>
    {!profile ? <p role="status">{error ?? 'Comprobando identidad…'}</p> : <>
      <header className="listing-heading"><p className="eyebrow">Empresa cotizada</p>
        <h1>{profile.company.legalName}</h1>
        <p>Mercado {profile.listing.mic} · {profile.listing.currency} · {profile.listing.symbol}
          {profile.listing.shareClass ? ` · Clase ${profile.listing.shareClass}` : ''} · {instrumentLabel[profile.listing.instrument]}</p>
        <p>Identidad verificada por: {profile.sources.map((source) => source.provider).join(', ')}.</p>
        <p>Última verificación: {profile.sources.map((source) => instant(source.verifiedAt, 'UTC')).join(', ')}</p>
      </header>
      <nav className="section-tabs" aria-label="Secciones de la empresa">
        <button aria-pressed={tab === 'market'} onClick={() => setTab('market')}>Precio e histórico</button>
        <button aria-pressed={tab === 'financials'} onClick={() => setTab('financials')}>Cuentas y métricas</button>
        <button aria-pressed={tab === 'news'} onClick={() => setTab('news')}>Noticias</button>
      </nav>
      {tab === 'market' && <><QuotePanel listing={profile.listing} /><HistoryPanel listing={profile.listing} /></>}
      {tab === 'financials' && <FinancialPanel key={profile.listing.id} profile={profile} />}
      {tab === 'news' && <NewsPanel key={profile.company.id} companyId={profile.company.id} listingId={profile.listing.id} />}
    </>}
  </div>
}
