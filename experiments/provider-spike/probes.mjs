// Pruebas de acceso y formato; no certifican licencia ni cobertura del producto.
import { calendarSummary, extractBlsReleases, extractEcbMeetings, extractFedMeetings } from './calendar-extract.mjs';
import { newsSummary, secDirectorySummary, stocklakeData, stocklakeHistorySummary,
  stocklakeQuoteSummary, tgmSeriesSummary, tgmStatementsSummary, tgmSummary } from './source-summary.mjs';

export function createProbes({ query = 'Apple', symbol = 'AAPL', cik = '0000320193',
  days = 5, years = 2, from = '2026-10-01', to = '2026-10-02' } = {}) {
  if (!/^\d{10}$/.test(cik)) throw new Error('El CIK debe tener diez dígitos.');
  if (!query.trim() || query.length > 100 || !/^[A-Za-z0-9.^:/-]{1,30}$/.test(symbol)) {
    throw new Error('Consulta o símbolo de prueba inválido.');
  }
  days = Number(days); years = Number(years);
  const civilDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!Number.isInteger(days) || days < 1 || days > 365 || !Number.isInteger(years) ||
      years < 2 || years > 20 || !civilDate(from) || !civilDate(to) || from > to) {
    throw new Error('Ventana de prueba inválida.');
  }
  const finnhub = (id, capability, path, validate) => ({
    id, provider: 'finnhub', capability,
    url: `https://finnhub.io/api/v1/${path}`,
    credentials: { 'X-Finnhub-Token': 'FINNHUB_API_KEY' },
    format: 'json', validate,
  });
  const metadataProbe = (id, provider, capability, url, summarize) => ({
    id, provider, capability, url, credentials: {}, format: 'json', summarize,
    validate: (_body, summary) => summary !== null,
    successReason: 'ACCESS_AND_METADATA_ONLY',
  });
  const stocklake = (id, name, args, summarize) => ({
    ...metadataProbe(id, 'stocklake', name, 'https://api.stocklake.dev/mcp', summarize),
    method: 'POST', headers: { 'MCP-Protocol-Version': '2025-11-25' },
    requires: 'stocklake-initialize', invalidReason: 'MCP_TOOL_ERROR_OR_INVALID_DATA',
    validate: (body, summary) => summary !== null &&
      (id === 'stocklake-name' || stocklakeData(body)?.symbol === symbol),
    body: { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: args } },
  });
  const tgm = (id, capability, path, summarize) => {
    const probe = metadataProbe(id, 'tgmcharts', capability, 'https://tgmcharts.com/api/v1/' + path, summarize);
    probe.validate = (body, summary) => body?.symbol === symbol && summary !== null;
    return probe;
  };
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
    {
      ...metadataProbe('sec-directory', 'sec', 'issuer-directory',
        'https://www.sec.gov/files/company_tickers_exchange.json',
        (body) => secDirectorySummary(body, query)),
      credentials: { 'User-Agent': 'SEC_USER_AGENT' },
      validate: (_body, summary) => summary !== null && summary.matchingRows > 0,
      invalidReason: 'NO_MATCHING_ISSUER_OR_INVALID_DIRECTORY',
    },
    finnhub('finnhub-search', 'search', `search?q=${encodeURIComponent(query)}`,
      (body) => Array.isArray(body?.result) && body.result.some((item) =>
        typeof item.symbol === 'string' && typeof item.description === 'string')),
    finnhub('finnhub-quote', 'quote', `quote?symbol=${encodeURIComponent(symbol)}`,
      (body) => Number.isFinite(body?.c) && body.c > 0 && Number.isFinite(body?.t) && body.t > 0),
    finnhub('finnhub-financials', 'metric-inputs', `stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`,
      (body) => body?.symbol === symbol && body?.metric && Object.keys(body.metric).length > 0),
    {
      ...finnhub('finnhub-news', 'company-news', 'company-news?symbol=' + encodeURIComponent(symbol) +
        '&from=' + from + '&to=' + to,
        (_body, summary) => summary !== null && summary.linkedItems === summary.items &&
          summary.datedItems === summary.items && summary.attributedItems === summary.items &&
          summary.itemsOutsideWindow === 0),
      summarize: (body) => newsSummary(body, from, to),
      successReason: 'ACCESS_AND_NEWS_METADATA_ONLY',
    },
    {
      id: 'stocklake-initialize', provider: 'stocklake', capability: 'mcp-handshake',
      url: 'https://api.stocklake.dev/mcp', credentials: {}, format: 'json', method: 'POST',
      body: { jsonrpc: '2.0', id: 1, method: 'initialize', params: {
        protocolVersion: '2025-11-25', capabilities: {},
        clientInfo: { name: 'inversiones-provider-evaluation', version: '1.0' },
      } },
      captureMcpSession: true,
      validate: (body) => body?.jsonrpc === '2.0' && body.result?.protocolVersion === '2025-11-25',
    },
    stocklake('stocklake-quote', 'get_stock', { symbol }, stocklakeQuoteSummary),
    stocklake('stocklake-name', 'get_stock', { symbol: query }, stocklakeQuoteSummary),
    stocklake('stocklake-history', 'get_stock_history', { symbol, days }, stocklakeHistorySummary),
    stocklake('stocklake-news', 'get_stock_news', { symbol, days }, (body) => {
      const data = stocklakeData(body);
      if (!data || !Array.isArray(data.articles)) return null;
      return { items: data.articles.length,
        linkedItems: data.articles.filter((item) => typeof item?.url === 'string').length,
        attributedItems: data.articles.filter((item) => typeof item?.source === 'string').length };
    }),
    tgm('tgm-summary', 'summary', 'summary/' + encodeURIComponent(symbol), tgmSummary),
    tgm('tgm-statements', 'statement-inputs', 'statements/' + encodeURIComponent(symbol) +
      '/income-statement?period=annual&years=' + years, tgmStatementsSummary),
    tgm('tgm-series', 'computed-metric-series', 'series/' + encodeURIComponent(symbol) +
      '/pe-ratio?years=' + years, tgmSeriesSummary),
    {
      id: 'alpaca-snapshot', provider: 'alpaca', capability: 'quote-iex',
      url: `https://data.alpaca.markets/v2/stocks/${encodeURIComponent(symbol)}/snapshot?feed=iex`,
      credentials: { 'APCA-API-KEY-ID': 'ALPACA_API_KEY', 'APCA-API-SECRET-KEY': 'ALPACA_API_SECRET' },
      format: 'json', validate: (body) => Number.isFinite(body?.latestTrade?.p) &&
        body.latestTrade.p > 0 && Number.isFinite(Date.parse(body?.latestTrade?.t)),
    },
  ];
}
