import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createProbes } from './probes.mjs';
import { runProbes } from './runner.mjs';
import { newsSummary, secDirectorySummary, stocklakeHistorySummary, stocklakeQuoteSummary,
  tgmSeriesSummary, tgmStatementsSummary, tgmSummary } from './source-summary.mjs';

const envelope = (data) => ({ jsonrpc: '2.0', result: { isError: false, structuredContent: data } });
const syntheticQuote = { symbol: 'SYNTH', currency: 'USD', exchange: 'TEST', price: 123.456789,
  updated_at: '2026-10-02T10:00:00+00:00', name: 'Empresa sintética', privateField: 'private-only' };
const bar = (day, source) => ({ date: day, open: 10, low: 9, high: 12, close: 11, volume: 100, source });
const options = { live: true, env: {}, sleep: async () => {} };

test('un 200 con isError false y error de herramienta no acredita una cotización', () => {
  assert.equal(stocklakeQuoteSummary(envelope({ error: { code: 'symbol_not_found' } })), null);
  assert.equal(stocklakeQuoteSummary(envelope({ ...syntheticQuote, price: 0 })), null);
  const summary = stocklakeQuoteSummary(envelope(syntheticQuote));
  assert.equal(summary.quoteObservationDeclared, false);
  assert.equal(summary.priceFeedDeclared, false);
  assert.equal(summary.providerUpdatedAt, syntheticQuote.updated_at);
  assert.equal(JSON.stringify(summary).includes('123.456789'), false);
  assert.equal(JSON.stringify(summary).includes('private-only'), false);
});

test('el histórico informa de mezcla de fuentes y ausencia de ajustes sin certificarlo', () => {
  const data = { symbol: 'SYNTH', count: 2, history: [
    bar('2026-10-01', 'ibkr'), bar('2026-10-02', 'yahoo'),
  ] };
  const summary = stocklakeHistorySummary(envelope(data));
  assert.deepEqual(summary.sources, ['ibkr', 'yahoo']);
  assert.equal(summary.homogeneousSource, false);
  assert.equal(summary.adjustmentDeclared, false);
  assert.equal(summary.currencyDeclared, false);
  for (const history of [
    [data.history[0], data.history[0]], [...data.history].reverse(),
    [{ ...data.history[0], close: 20 }, data.history[1]],
    [{ ...data.history[0], date: '2026-02-30' }, data.history[1]],
    [null, data.history[1]],
  ]) assert.equal(stocklakeHistorySummary(envelope({ ...data, history })), null);
});

test('TGM distingue actualización de observación y serie de ratio de un precio histórico', () => {
  const summary = tgmSummary({ symbol: 'SYNTH', currency: 'USD',
    asOf: { dataUpdatedAt: '2026-10-02T16:00:00Z' },
    price: { lastClose: 10, lastCloseDate: '2026-10-02', priceSource: 'fmp-delayed' } });
  assert.equal(summary.quoteObservationDeclared, false);
  const series = { symbol: 'SYNTH', metric: 'pe-ratio', unit: 'ratio', basis: 'daily',
    methodology: 'Método sintético', points: [{ date: '2026-10-01', value: null },
      { date: '2026-10-02', value: 12 }] };
  assert.equal(tgmSeriesSummary(series).missingPoints, 1);
  assert.equal(tgmSeriesSummary({ ...series, unit: 'USD' }), null);
  assert.equal(tgmSeriesSummary({ ...series, points: [...series.points].reverse() }), null);
});

test('cuentas sin procedencia por valor o con periodo invertido no pasan', () => {
  const row = { periodStart: '2025-01-01', periodEnd: '2025-12-31', filed: '2026-02-01',
    metrics: { revenue: 123.456789, netIncome: null },
    provenance: { revenue: { tag: 'Revenues', accn: '0000000001-26-000001', filed: '2026-02-01' } } };
  const data = { symbol: 'SYNTH', currency: 'USD', rows: [row],
    source: 'SEC EDGAR XBRL company facts (public domain)' };
  assert.equal(tgmStatementsSummary(data).perValueProvenancePresent, true);
  assert.equal(JSON.stringify(tgmStatementsSummary(data)).includes('123.456789'), false);
  assert.equal(tgmStatementsSummary({ ...data, rows: [{ ...row, provenance: {} }] }), null);
  assert.equal(tgmStatementsSummary({ ...data, rows: [{ ...row, periodStart: '2026-01-01' }] }), null);
  assert.equal(tgmStatementsSummary({ ...data, rows: [{ ...row, metrics: {} }] }), null);
  assert.equal(tgmStatementsSummary({ ...data, rows: [{ ...row, metrics: { revenue: null } }] }), null);
  assert.equal(tgmStatementsSummary({ ...data, rows: [null] }), null);
  const longTag = 'SyntheticAccountingConceptWithALongNameRepresentingIncomeBeforeTaxesAndOtherAdjustments';
  assert.equal(tgmStatementsSummary({ ...data, rows: [{ ...row,
    provenance: { revenue: { ...row.provenance.revenue, tag: longTag } } }] }).periods, 1);
});

test('el directorio SEC conserva ambigüedad entre emisores y clases sin publicar filas', () => {
  const data = { fields: ['cik', 'name', 'ticker', 'exchange'],
    data: [[1, 'Empresa sintética', 'SYN-A', 'Test'], [1, 'Empresa sintética', 'SYN-B', 'Test'],
      [2, 'Empresa sintética distinta', 'OTHER', 'Test']] };
  const summary = secDirectorySummary(data, 'Empresa');
  assert.equal(summary.matchingRows, 3);
  assert.equal(summary.matchingIssuers, 2);
  assert.equal(JSON.stringify(summary).includes('SYN-A'), false);
  assert.equal(secDirectorySummary(data, 'sin coincidencia').matchingRows, 0);
  assert.equal(secDirectorySummary({ ...data, fields: ['name'] }, 'Empresa'), null);
});

test('noticias requieren atribución, URL HTTPS sin credenciales y fecha dentro de la ventana', () => {
  const article = { url: 'https://example.org/news', source: 'Medio sintético',
    datetime: Date.parse('2026-10-02T10:00:00Z') / 1000, headline: 'Titular privado sintético' };
  assert.deepEqual(newsSummary([article], '2026-10-01', '2026-10-02'), {
    items: 1, linkedItems: 1, datedItems: 1, attributedItems: 1, itemsOutsideWindow: 0,
  });
  assert.equal(newsSummary([{ ...article, url: 'https://user:pass@example.org/news' }],
    '2026-10-01', '2026-10-02').linkedItems, 0);
  assert.equal(newsSummary([article], '2026-10-03', '2026-10-04').itemsOutsideWindow, 1);
  assert.equal(newsSummary([{ ...article, datetime: Number.MAX_VALUE }], '2026-10-01',
    '2026-10-02').datedItems, 0);
  assert.equal(JSON.stringify(newsSummary([article], '2026-10-01', '2026-10-02')).includes(article.headline), false);
  assert.equal(newsSummary([null], '2026-10-01', '2026-10-02'), null);
});

test('MCP exige inicialización probada y cuenta ambas peticiones en el presupuesto', async () => {
  const probes = createProbes().filter((probe) =>
    ['stocklake-initialize', 'stocklake-quote'].includes(probe.id));
  const missing = await runProbes([probes[1]], { ...options, fetcher: () => assert.fail('No red') });
  assert.equal(missing.requests, 0);
  assert.equal(missing.results[0].reason, 'PREREQUISITE_NOT_PROBED');
  const session = 'synthetic-private-session';
  let calls = 0;
  const fetcher = async (_url, init) => {
    calls += 1;
    if (calls === 1) return Response.json({ jsonrpc: '2.0', result: { protocolVersion: '2025-11-25' } },
      { headers: { 'Mcp-Session-Id': session } });
    assert.equal(init.headers['Mcp-Session-Id'], session);
    return Response.json(envelope({ ...syntheticQuote, symbol: 'AAPL' }));
  };
  const report = await runProbes(probes, { ...options, maxRequests: 2, fetcher });
  assert.equal(report.requests, 2);
  assert.ok(report.results.every((result) => result.status === 'PROBADO'));
  assert.equal(JSON.stringify(report).includes(session), false);
  const limited = await runProbes(probes, { ...options, maxRequests: 1,
    fetcher: async () => Response.json({ jsonrpc: '2.0', result: { protocolVersion: '2025-11-25' } }) });
  assert.equal(limited.requests, 1);
  assert.equal(limited.results[1].status, 'OMITIDO');
  const wrongInstrument = await runProbes(probes, { ...options, maxRequests: 2,
    fetcher: async (_url, init) => JSON.parse(init.body).method === 'initialize'
      ? Response.json({ jsonrpc: '2.0', result: { protocolVersion: '2025-11-25' } })
      : Response.json(envelope({ ...syntheticQuote, symbol: 'OTHER' })) });
  assert.equal(wrongInstrument.results[1].status, 'FALLO');
});

test('la CLI rechaza modo vivo sin casos y ventanas imposibles antes de llamar a red', () => {
  const result = spawnSync(process.execPath, [new URL('./cli.mjs', import.meta.url).pathname, '--live'],
    { encoding: 'utf8', env: {} });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.throws(() => createProbes({ days: 366 }));
  assert.throws(() => createProbes({ years: 1 }));
  assert.throws(() => createProbes({ from: '2026-02-30' }));
  assert.throws(() => createProbes({ from: '2026-10-03', to: '2026-10-02' }));
});
