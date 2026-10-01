import { useEffect, useState } from 'react'
import './App.css'

type Connection = 'checking' | 'ready' | 'unavailable'

function App() {
  const [connection, setConnection] = useState<Connection>('checking')

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/health', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Health check failed')
        return response.json() as Promise<unknown>
      })
      .then((health) => setConnection(
        health !== null && typeof health === 'object' &&
        'status' in health && health.status === 'preparacion' &&
        'liveData' in health && health.liveData === false
          ? 'ready' : 'unavailable',
      ))
      .catch(() => {
        if (!controller.signal.aborted) setConnection('unavailable')
      })
    return () => controller.abort()
  }, [])

  const connectionLabel = {
    checking: 'Comprobando conexión local…',
    ready: 'Web y API locales conectadas',
    unavailable: 'La API local no responde',
  }[connection]

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand" aria-label="Inversiones">
          <span className="brand-mark" aria-hidden="true">I</span>
          <span>Inversiones</span>
        </div>
        <span className="stage">Fase de preparación</span>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="eyebrow">Análisis de empresas cotizadas</p>
        <h1 id="intro-title">Información clara. Fuentes visibles.</h1>
        <p className="lead">
          Estamos preparando la búsqueda por nombre, los datos financieros y el
          contexto de cada empresa. Aquí aparecerán cuando sus fuentes y su
          funcionamiento hayan sido comprobados.
        </p>
        <div className={'connection connection-' + connection} role="status" aria-live="polite">
          <span className="connection-dot" aria-hidden="true" />
          {connectionLabel}
        </div>
      </section>

      <section className="cards" aria-label="Bloques previstos">
        <article className="card">
          <span className="card-number">01</span>
          <h2>Buscar una empresa</h2>
          <p>Por su nombre, con selección de mercado e instrumento cuando haga falta.</p>
          <span className="card-status">Pendiente de integración</span>
        </article>
        <article className="card">
          <span className="card-number">02</span>
          <h2>Entender los datos</h2>
          <p>Precio, cuentas y métricas con fuente, moneda, periodo y fecha visibles.</p>
          <span className="card-status">Pendiente de integración</span>
        </article>
        <article className="card">
          <span className="card-number">03</span>
          <h2>Ver el contexto</h2>
          <p>Noticias, acontecimientos y comparables con sus límites explicados.</p>
          <span className="card-status">Pendiente de integración</span>
        </article>
      </section>

      <footer className="footer">
        <p>Base local de desarrollo. Todavía no muestra cotizaciones ni consultas reales.</p>
      </footer>
    </main>
  )
}

export default App
