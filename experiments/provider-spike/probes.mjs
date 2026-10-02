// Pruebas de acceso y formato; no certifican licencia ni cobertura del producto.
import { calendarSummary, extractBlsReleases, extractEcbMeetings, extractFedMeetings } from './calendar-extract.mjs';

export function createProbes({ query = 'Apple', symbol = 'AAPL', cik = '0000320193' } = {}) {
  if (!/^\d{10}$/.test(cik)) throw new Error('El CIK debe tener diez dígitos.');
  if (!query.trim() || query.length > 100 || !/^[A-Za-z0-9.^:/-]{1,30}$/.test(symbol)) {
    throw new Error('Consulta o símbolo de prueba inválido.');
  }
  const finnhub = (id, capability, path, validate) => ({
    id, provider: 'finnhub', capability,
    url: `https://finnhub.io/api/v1/${path}`,
    credentials: { 'X-Finnhub-Token': 'FINNHUB_API_KEY' },
    format: 'json', validate,
  });
  return [
    {
      id: 'openfigi-search', provider: 'openfigi', capability: 'instrument-search',
      url: 'https://api.openfigi.com/v3/search', method: 'POST',
      body: { query, marketSecDes: 'Equity' },
      credentials: {}, format: 'json', invalidReason: 'NO_MATCHING_COMMON_STOCK_ON_FIRST_PAGE',
      validate: (body) => Array.isArray(body?.data) && body.data.some((item) =>
        item.securityType2 === 'Common Stock' && typeof item.figi === 'string' &&
        typeof item.name === 'string' && item.name.toLowerCase().includes(query.toLowerCase())),
    },
    {
      id: 'fed-calendar', provider: 'federal-reserve', capability: 'calendar-resource',
      url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
      credentials: {}, format: 'html',
      summarize: (body) => calendarSummary(extractFedMeetings(body)),
      validate: (_body, summary) => summary.upcoming > 0,
    },
    {
      id: 'ecb-calendar', provider: 'ecb', capability: 'calendar-resource',
      url: 'https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html',
      credentials: {}, format: 'html',
      summarize: (body) => calendarSummary(extractEcbMeetings(body)),
      validate: (_body, summary) => summary.upcoming > 0,
    },
    {
      id: 'bls-calendar', provider: 'bls', capability: 'calendar-resource',
      url: 'https://www.bls.gov/schedule/news_release/bls.ics',
      credentials: {}, format: 'ics',
      summarize: (body) => calendarSummary(extractBlsReleases(body),
        new Date(Date.now() + 86400000).toISOString().slice(0, 10)),
      validate: (_body, summary) => summary.upcoming > 0,
    },
    {
      id: 'sec-submissions', provider: 'sec', capability: 'filings',
      url: `https://data.sec.gov/submissions/CIK${cik}.json`,
      credentials: { 'User-Agent': 'SEC_USER_AGENT' }, format: 'json',
      validate: (body) => Number(body?.cik) === Number(cik) &&
        Array.isArray(body?.filings?.recent?.accessionNumber) &&
        body.filings.recent.accessionNumber.length > 0,
    },
    finnhub('finnhub-search', 'search', `search?q=${encodeURIComponent(query)}`,
      (body) => Array.isArray(body?.result) && body.result.some((item) =>
        typeof item.symbol === 'string' && typeof item.description === 'string')),
    finnhub('finnhub-quote', 'quote', `quote?symbol=${encodeURIComponent(symbol)}`,
      (body) => Number.isFinite(body?.c) && body.c > 0 && Number.isFinite(body?.t) && body.t > 0),
    finnhub('finnhub-financials', 'metric-inputs', `stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`,
      (body) => body?.symbol === symbol && body?.metric && Object.keys(body.metric).length > 0),
    {
      id: 'alpaca-snapshot', provider: 'alpaca', capability: 'quote-iex',
      url: `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/snapshot?feed=iex`,
      credentials: { 'APCA-API-KEY-ID': 'ALPACA_API_KEY', 'APCA-API-SECRET-KEY': 'ALPACA_API_SECRET' },
      format: 'json', validate: (body) => Number.isFinite(body?.latestTrade?.p) &&
        body.latestTrade.p > 0 && Number.isFinite(Date.parse(body?.latestTrade?.t)),
    },
  ];
}
