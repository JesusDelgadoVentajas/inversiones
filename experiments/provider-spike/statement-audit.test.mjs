import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditStatements } from './statement-audit.mjs';

const options = { symbols: ['SYN'], maxRequests: 5, env: { SEC_USER_AGENT: 'Synthetic contact synthetic@example.invalid' },
  sleep: async () => {} };
const origin = { tag: 'Revenues', accn: '0000000123-26-000001', filed: '2026-02-01' };
const row = { periodStart: '2025-01-01', periodEnd: '2025-12-31',
  metrics: { revenue: 100, grossProfit: 100, operatingIncome: 100, netIncome: 100 },
  provenance: Object.fromEntries(['revenue', 'grossProfit', 'operatingIncome', 'netIncome'].map((name) => [name, origin])) };
const secondary = { symbol: 'SYN', cik: 123, currency: 'USD', rows: [row, { ...row,
  periodStart: '2024-01-01', periodEnd: '2024-12-31' }] };
const primary = { cik: 123, tag: 'Revenues', units: { USD: secondary.rows.map((item) => ({
  start: item.periodStart, end: item.periodEnd, val: 100, accn: origin.accn, filed: origin.filed,
})) } };

test('contrasta periodo/documento/valor y no publica cuerpos ni contacto privado', async () => {
  let calls = 0;
  const result = await auditStatements({ ...options, fetcher: async () => Response.json(++calls === 1 ? secondary : primary) });
  assert.equal(calls, 2);
  assert.equal(result.results[0].reason, 'EIGHT_VALUES_MATCH_PRIMARY_RECORDS');
  assert.equal(result.results[0].comparisons.length, 8);
  assert.equal(JSON.stringify(result).includes('synthetic@example.invalid'), false);
  assert.equal(JSON.stringify(result).includes('"val"'), false);
  assert.equal(JSON.stringify(result).includes('"metrics"'), false);
});
test('una discrepancia monetaria no se transforma en coincidencia', async () => {
  let calls = 0;
  const result = await auditStatements({ ...options, fetcher: async () => Response.json(++calls === 1 ? secondary :
    { ...primary, units: { USD: primary.units.USD.map((item) => ({ ...item, val: 101 })) } }) });
  assert.equal(result.results[0].reason, 'PARTIAL_OR_DISCREPANT');
  assert.equal(result.results[0].comparisons[0].status, 'VALUE_DISCREPANCY');
});
test('un HTTP 200 sin cuentas, presupuesto agotado y HTTP 429 conservan motivos', async () => {
  const empty = await auditStatements({ ...options, fetcher: async () => Response.json({ symbol: 'SYN', cik: null }) });
  assert.equal(empty.results[0].reason, 'STATEMENT_IDENTITY_OR_PERIODS_NOT_COVERED');
  const exhausted = await auditStatements({ ...options, maxRequests: 1, fetcher: async () => Response.json(secondary) });
  assert.equal(exhausted.requests, 1);
  assert.equal(exhausted.results[0].comparisons[0].status, 'NOT_PROBED');
  const limited = await auditStatements({ ...options, symbols: ['SYN', 'OTHER'],
    fetcher: async () => new Response('', { status: 429 }) });
  assert.equal(limited.requests, 1);
  assert.equal(limited.results[0].reason, 'HTTP_429');
});
