import { useEffect, useState } from 'react'
import './App.css'
import { healthSchema } from '../shared/contracts/health.js'
import { readApi } from './api.js'
import { CompanySearch } from './components/CompanySearch.js'
import { ListingPage } from './components/ListingPage.js'

type Connection = 'checking' | 'ready' | 'unavailable'

function App() {
  const [connection, setConnection] = useState<Connection>('checking')
  const [searchEnabled, setSearchEnabled] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    readApi('/api/health', healthSchema, controller.signal)
      .then((health) => {
        if (!controller.signal.aborted) { setConnection('ready'); setSearchEnabled(health.searchAvailable) }
      })
      .catch(() => {
        if (!controller.signal.aborted) setConnection('unavailable')
      })
    return () => controller.abort()
  }, [])

  const connectionLabel = {
    checking: 'Comprobando conexión…',
    ready: 'Conexión disponible',
    unavailable: 'La conexión no está disponible',
  }[connection]
  const listing = window.location.pathname.match(/^\/listings\/([^/]+)$/)?.[1]

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand" aria-label="Inversiones">
          <span className="brand-mark" aria-hidden="true">I</span>
          <span>Inversiones</span>
        </div>
        <span className="stage">{searchEnabled ? 'Consulta personal' : 'Fase de preparación'}</span>
      </header>

      {listing ? <ListingPage id={listing} /> : <>
      <section className="intro" aria-labelledby="intro-title">
        <p className="eyebrow">Análisis de empresas cotizadas</p>
        <h1 id="intro-title">Información clara. Fuentes visibles.</h1>
        <p className="lead">
          {searchEnabled ? 'Busca una empresa y selecciona su instrumento para consultar precios, históricos y fechas de las fuentes disponibles.' : <>Estamos preparando la búsqueda por nombre, los datos financieros y el
          contexto de cada empresa. Aquí aparecerán cuando sus fuentes y su
          funcionamiento hayan sido comprobados.</>}
        </p>
        <div className={'connection connection-' + connection} role="status" aria-live="polite">
          <span className="connection-dot" aria-hidden="true" />
          {connectionLabel}
        </div>
      </section>

      <CompanySearch enabled={searchEnabled} />
      </>}

      <footer className="footer">
        <p>{searchEnabled ? 'Cada bloque conserva su fuente, moneda y fecha de observación.' :
          'Aplicación en preparación. Las fuentes reales aún no están activadas.'}</p>
      </footer>
    </main>
  )
}

export default App
