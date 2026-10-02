// Solo metadatos de ensayos: nunca precios, importes, titulares o cuerpos originales.
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const positive = (value) => finite(value) && value > 0;
const label = (value) => typeof value === 'string' && /^[A-Za-z0-9._-]{1,80}$/.test(value);
const tag = (value) => typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_.:-]{0,199}$/.test(value);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const date = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const instant = (value) => typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
  Number.isFinite(Date.parse(value));
const ordered = (rows, key) => rows.every((row, i) => row &&
  (i === 0 || rows[i - 1]?.[key] < row[key]));

export function stocklakeData(body) {
  const result = body?.result;
  return body?.jsonrpc === '2.0' && !body.error && result?.isError !== true &&
    result?.structuredContent && !result.structuredContent.error ? result.structuredContent : null;
}

export function stocklakeQuoteSummary(body) {
  const data = stocklakeData(body);
  if (!data || !label(data.symbol) || !positive(data.price) ||
      !/^[A-Z]{3}$/.test(data.currency) || !label(data.exchange)) return null;
  return { resolvedSymbol: data.symbol, currency: data.currency, exchangeAlias: data.exchange,
    providerUpdatedAt: instant(data.updated_at) ? data.updated_at : null,
    quoteObservationDeclared: instant(data.observed_at) || instant(data.quote_timestamp),
    priceFeedDeclared: label(data.feed) || label(data.source) };
}

export function stocklakeHistorySummary(body) {
  const data = stocklakeData(body);
  const rows = data?.history;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 365 ||
      rows.length !== data.count || !label(data.symbol) || !ordered(rows, 'date') ||
      !rows.every((row) => date(row.date) && [row.open, row.high, row.low, row.close].every(positive) &&
        row.low <= Math.min(row.open, row.close) && Math.max(row.open, row.close) <= row.high &&
        finite(row.volume) && row.volume >= 0)) return null;
  const sources = [...new Set(rows.map((row) => label(row.source) ? row.source : 'unknown'))].sort();
  return { bars: rows.length, firstDate: rows[0].date, lastDate: rows.at(-1).date,
    sources, homogeneousSource: sources.length === 1 && sources[0] !== 'unknown',
    currencyDeclared: typeof data.currency === 'string' && /^[A-Z]{3}$/.test(data.currency),
    adjustmentDeclared: ['raw', 'split_adjusted', 'total_return'].includes(data.adjustment) };
}

export function tgmSummary(body) {
  if (!label(body?.symbol) || !/^[A-Z]{3}$/.test(body.currency) ||
      !positive(body.price?.lastClose) || !date(body.price.lastCloseDate)) return null;
  return { currency: body.currency, lastCloseDate: body.price.lastCloseDate,
    priceSource: label(body.price.priceSource) ? body.price.priceSource : null,
    providerUpdatedAt: instant(body.asOf?.dataUpdatedAt) ? body.asOf.dataUpdatedAt : null,
    quoteObservationDeclared: instant(body.price.observedAt) || instant(body.price.quoteTimestamp) };
}

export function tgmStatementsSummary(body) {
  const rows = body?.rows;
  if (!label(body?.symbol) || !/^[A-Z]{3}$/.test(body.currency) || !Array.isArray(rows) ||
      !rows.length || rows.length > 120 || !rows.every((row) => row &&
        date(row.periodStart) && date(row.periodEnd) && row.periodStart <= row.periodEnd &&
        date(row.filed) && row.periodEnd <= row.filed && object(row.metrics) && object(row.provenance) &&
        Object.values(row.metrics).some(finite) &&
        Object.entries(row.metrics).every(([key, value]) => value === null ||
          finite(value) && tag(row.provenance[key]?.tag) &&
          /^\d{10}-\d{2}-\d{6}$/.test(row.provenance[key]?.accn) &&
          date(row.provenance[key]?.filed)))) return null;
  const ends = rows.map((row) => row.periodEnd).sort();
  return { periods: rows.length, firstPeriodEnd: ends[0],
    lastPeriodEnd: ends.at(-1), perValueProvenancePresent: true,
    providerAsOf: instant(body.asOf) ? body.asOf : null,
    declaredSecSource: body.source === 'SEC EDGAR XBRL company facts (public domain)' };
}

export function tgmSeriesSummary(body) {
  const rows = body?.points;
  if (!label(body?.symbol) || body.metric !== 'pe-ratio' || body.unit !== 'ratio' ||
      body.basis !== 'daily' || !Array.isArray(rows) || !rows.length || rows.length > 6000 ||
      !ordered(rows, 'date') || !rows.every((row) =>
        date(row.date) && (row.value === null || finite(row.value)))) return null;
  return { points: rows.length, firstDate: rows[0].date, lastDate: rows.at(-1).date,
    unit: 'ratio', basis: 'daily', missingPoints: rows.filter((row) => row.value === null).length,
    methodologyPresent: typeof body.methodology === 'string' && body.methodology.length > 0 };
}

export function newsSummary(body, from, to) {
  if (!Array.isArray(body) || !body.length || !body.every(object)) return null;
  const validUrls = body.filter((item) => {
    try {
      const url = new URL(item.url);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch { return false; }
  }).length;
  const dated = body.filter((item) => positive(item.datetime) &&
    Number.isFinite(new Date(item.datetime * 1000).getTime()));
  return { items: body.length, linkedItems: validUrls, datedItems: dated.length,
    attributedItems: body.filter((item) => typeof item.source === 'string' && item.source.trim()).length,
    itemsOutsideWindow: body.length - dated.length + dated.filter((item) =>
      new Date(item.datetime * 1000).toISOString().slice(0, 10) < from ||
      new Date(item.datetime * 1000).toISOString().slice(0, 10) > to).length };
}

export function secDirectorySummary(body, query) {
  if (!Array.isArray(body?.fields) || !Array.isArray(body.data) || !body.data.length) return null;
  const nameIndex = body.fields.indexOf('name');
  const cikIndex = body.fields.indexOf('cik');
  const tickerIndex = body.fields.indexOf('ticker');
  const exchangeIndex = body.fields.indexOf('exchange');
  if ([nameIndex, cikIndex, tickerIndex, exchangeIndex].some((index) => index < 0) ||
      !body.data.every((row) => Array.isArray(row) &&
        Number.isInteger(row[cikIndex]) && row[cikIndex] > 0 &&
        typeof row[nameIndex] === 'string' && typeof row[tickerIndex] === 'string')) return null;
  const matched = body.data.filter((row) =>
    row[nameIndex].normalize('NFC').toLowerCase().includes(query.normalize('NFC').toLowerCase()));
  return { directoryRows: body.data.length, matchingRows: matched.length,
    matchingIssuers: new Set(matched.map((row) => row[cikIndex])).size,
    exchangeNamesPresent: matched.every((row) => typeof row[exchangeIndex] === 'string') };
}
