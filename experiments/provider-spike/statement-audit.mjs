// Contraste independiente: no activa un adaptador ni publica respuestas financieras.
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { readLimited } from './runner.mjs';

const checkedDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const accession = (value) => typeof value === 'string' && /^\d{10}-\d{2}-\d{6}$/.test(value);
const tag = (value) => typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_]{0,199}$/.test(value);
const numeric = (value) => typeof value === 'number' && Number.isFinite(value) &&
  (!Number.isInteger(value) || Number.isSafeInteger(value));

export async function auditStatements({ symbols = ['AAPL', 'MSFT', 'BAND'], maxRequests = 24,
  env = process.env, fetcher = fetch, sleep = delay, onSecConcept = () => {} } = {}) {
  if (!Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 80 ||
    !symbols.length || symbols.length > 5 || symbols.some((symbol) => !/^[A-Z.-]{1,20}$/.test(symbol)) ||
    !/\S+@\S+\.\S+/.test(env.SEC_USER_AGENT ?? '')) throw new Error('INVALID_AUDIT_CONFIGURATION');
  const report = { checkedAt: new Date().toISOString(), environment: 'local', requests: 0, results: [],
    scope: 'Contraste de cuentas y metadatos. No certifica métricas, licencias completas o Worker.' };
  const cache = new Map();
  const stopped = new Set();
  const get = async (provider, url) => {
    if (stopped.has(provider) || report.requests >= maxRequests) return null;
    if (report.requests) await sleep(1100);
    report.requests += 1;
    const start = performance.now();
    const result = { provider, checkedAt: new Date().toISOString() };
    try {
      const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { Accept: 'application/json', ...(provider === 'sec' ? { 'User-Agent': env.SEC_USER_AGENT } : {}) } });
      result.httpStatus = response.status;
      if (!response.ok) {
        await response.body?.cancel();
        if ([401, 403, 429].includes(response.status)) stopped.add(provider);
        result.reason = 'HTTP_' + response.status; return { body: null, result };
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        await response.body?.cancel(); result.reason = 'CONTENT_TYPE_MISMATCH'; return { body: null, result };
      }
      const raw = await readLimited(response, 2_000_000);
      result.bytes = raw.bytes;
      const parseStarted = performance.now();
      const body = JSON.parse(raw.text);
      result.parseMs = Math.round((performance.now() - parseStarted) * 1000) / 1000;
      result.reason = 'ACCESS_ONLY';
      return { body, result };
    } catch {
      result.reason = 'TRANSPORT_SIZE_OR_FORMAT_ERROR'; return { body: null, result };
    } finally { result.durationMs = Math.round(performance.now() - start); report.results.push(result); }
  };
  for (const symbol of symbols) {
    const response = await get('tgmcharts', 'https://tgmcharts.com/api/v1/statements/' + symbol +
      '/income-statement?period=annual&years=2');
    const data = response?.body;
    if (!data) { if (response) response.result.symbol = symbol; continue; }
    const cik = data && /^\d{1,10}$/.test(String(data.cik)) && Number(data.cik) > 0
      ? String(data.cik).padStart(10, '0') : null;
    if (data?.symbol !== symbol || !cik || !/^[A-Z]{3}$/.test(data.currency) ||
      !Array.isArray(data.rows) || data.rows.length !== 2) {
      if (response) { response.result.symbol = symbol; response.result.reason = 'STATEMENT_IDENTITY_OR_PERIODS_NOT_COVERED'; }
      continue;
    }
    response.result.symbol = symbol;
    response.result.statementPeriods = data.rows.length;
    const outcomes = [];
    // Cuatro conceptos primarios permiten contrastar cinco métricas con el ejercicio anterior.
    for (const metric of ['revenue', 'grossProfit', 'operatingIncome', 'netIncome']) {
      for (const row of data.rows) {
        const origin = row.provenance?.[metric];
        if (!numeric(row.metrics?.[metric]) || !tag(origin?.tag) || !accession(origin?.accn) ||
          !checkedDate(origin.filed) || !checkedDate(row.periodStart) || !checkedDate(row.periodEnd)) {
          outcomes.push({ metric, periodEnd: checkedDate(row.periodEnd) ? row.periodEnd : null, status: 'INVALID_METADATA' });
          continue;
        }
        const key = cik + '/' + origin.tag;
        if (!cache.has(key)) {
          const sec = await get('sec', 'https://data.sec.gov/api/xbrl/companyconcept/CIK' +
            cik + '/us-gaap/' + origin.tag + '.json');
          cache.set(key, sec?.body ?? null);
          if (sec?.body && Number(sec.body.cik) === Number(data.cik) && sec.body.tag === origin.tag) {
            sec.result.symbol = symbol; sec.result.concept = origin.tag;
            onSecConcept(sec.body, { symbol, cik: data.cik, checkedAt: sec.result.checkedAt });
          }
        }
        const body = cache.get(key);
        const rows = Number(body?.cik) === Number(data.cik) && body?.tag === origin.tag
          ? body.units?.[data.currency] : null;
        const matches = Array.isArray(rows) ? rows.filter((item) => item.start === row.periodStart &&
          item.end === row.periodEnd && item.accn === origin.accn && item.filed === origin.filed) : [];
        outcomes.push({ metric, periodEnd: row.periodEnd, filed: origin.filed, tag: origin.tag,
          documentUrl: 'https://www.sec.gov/Archives/edgar/data/' + Number(data.cik) + '/' +
            origin.accn.replaceAll('-', '') + '/' + origin.accn + '-index.html',
          status: matches.length && matches.every((item) => numeric(item.val) && item.val === row.metrics[metric])
            ? 'EXACT_MATCH' : matches.length ? 'VALUE_DISCREPANCY' : body ? 'PERIOD_DOCUMENT_NOT_FOUND' : 'NOT_PROBED' });
      }
    }
    response.result.comparisons = outcomes;
    response.result.reason = outcomes.length === 8 && outcomes.every((item) => item.status === 'EXACT_MATCH')
      ? 'EIGHT_VALUES_MATCH_PRIMARY_RECORDS' : 'PARTIAL_OR_DISCREPANT';
  }
  return report;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const { values } = parseArgs({ options: { live: { type: 'boolean' },
      symbol: { type: 'string', multiple: true }, 'max-requests': { type: 'string', default: '24' } } });
    if (!values.live) throw new Error('LIVE_FLAG_REQUIRED');
    console.log(JSON.stringify(await auditStatements({ symbols: values.symbol,
      maxRequests: Number(values['max-requests']) }), null, 2));
  } catch { console.error('Ensayo no ejecutado: revisa argumentos y configuración privada.'); process.exitCode = 1; }
}
