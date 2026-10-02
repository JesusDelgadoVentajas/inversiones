import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runProbes } from './runner.mjs';
import { createProbes } from './probes.mjs';

const probe = {
  id: 'test', provider: 'synthetic', capability: 'quote', url: 'https://example.invalid',
  credentials: {}, format: 'json', validate: (body) => body?.price > 0,
};
const options = { live: true, sleep: async () => {}, env: {} };
const validResponse = () => Response.json({ price: 100 });

test('dry-run y credenciales ausentes no realizan peticiones', async () => {
  let calls = 0;
  const fetcher = async () => { calls += 1; return validResponse(); };
  const dry = await runProbes([probe], { fetcher });
  const missing = await runProbes([{ ...probe, credentials: { token: 'TEST_KEY' } }], { ...options, fetcher });
  assert.equal(calls, 0);
  assert.equal(dry.results[0].status, 'PLANIFICADO');
  assert.equal(missing.results[0].reason, 'MISSING_CONFIGURATION');
});

test('el presupuesto limita las llamadas y mantiene la pausa entre peticiones', async () => {
  let calls = 0;
  const pauses = [];
  const report = await runProbes([probe, probe, probe], {
    ...options, maxRequests: 2, sleep: async (ms) => { pauses.push(ms); },
    fetcher: async () => { calls += 1; return validResponse(); },
  });
  assert.equal(calls, 2);
  assert.deepEqual(pauses, [1100]);
  assert.equal(report.results[2].status, 'OMITIDO');
});

test('un 429 detiene los siguientes intentos al mismo proveedor', async () => {
  const report = await runProbes([probe, probe], {
    ...options, fetcher: async () => new Response('private', { status: 429 }),
  });
  assert.equal(report.requests, 1);
  assert.equal(report.results[0].reason, 'HTTP_429');
  assert.equal(report.results[1].status, 'OMITIDO');
});

test('no filtra credenciales, mensajes externos ni respuestas al informe', async () => {
  const secret = 'synthetic-secret-only';
  const report = await runProbes([{ ...probe, credentials: { token: 'TEST_KEY' } }], {
    ...options, env: { TEST_KEY: secret },
    fetcher: async (_, init) => {
      assert.equal(init.headers.token, secret);
      assert.equal(init.redirect, 'error');
      throw new Error(secret);
    },
  });
  assert.equal(JSON.stringify(report).includes(secret), false);
  assert.equal(report.results[0].status, 'FALLO');
});

test('rechaza HTML disfrazado, JSON inválido, datos vacíos y cuerpos excesivos', async () => {
  for (const [response, expected] of [
    [new Response('HTML', { headers: { 'content-type': 'text/html' } }), 'CONTENT_TYPE_MISMATCH'],
    [new Response('{', { headers: { 'content-type': 'application/json' } }), 'INVALID_JSON'],
    [Response.json({ price: 0 }), 'INVALID_OR_EMPTY_RESPONSE'],
    [Response.json({ data: 'x'.repeat(100) }), 'RESPONSE_TOO_LARGE'],
  ]) {
    const report = await runProbes([probe], { ...options, maxBytes: 30, fetcher: async () => response });
    assert.equal(report.results[0].reason, expected);
  }
});

test('configura timeout y clasifica su fallo sin divulgar mensajes', async () => {
  const report = await runProbes([probe], { ...options, fetcher: async (_, init) => {
    assert.ok(init.signal instanceof AbortSignal);
    throw new DOMException('private', 'TimeoutError');
  } });
  assert.equal(report.results[0].reason, 'TIMEOUT');
});

test('un presupuesto inválido falla antes de acceder a red', async () => {
  await assert.rejects(runProbes([probe], { ...options, maxRequests: 11 }));
});

test('la SEC requiere un contacto y no acepta otro emisor como resultado', async () => {
  const sec = createProbes().find((item) => item.id === 'sec-submissions');
  const report = await runProbes([sec], { ...options, env: { SEC_USER_AGENT: 'sin-contacto' } });
  assert.equal(report.requests, 0);
  assert.equal(report.results[0].reason, 'SEC_CONTACT_REQUIRED');
  assert.equal(sec.validate({ cik: '9999999999', filings: { recent: { accessionNumber: ['synthetic'] } } }), false);
});

test('OpenFIGI usa POST limitado y no da por válida una página solo de derivados', async () => {
  const openfigi = createProbes({ query: 'Inditex' }).find((item) => item.id === 'openfigi-search');
  const report = await runProbes([openfigi], { ...options, fetcher: async (url, init) => {
    assert.equal(url, 'https://api.openfigi.com/v3/search');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(init.body), { query: 'Inditex', marketSecDes: 'Equity' });
    return Response.json({ data: [{ name: 'Inditex', securityType2: 'Future', figi: 'SYNTHETIC' }] });
  } });
  assert.equal(report.requests, 1);
  assert.equal(report.results[0].reason, 'NO_MATCHING_COMMON_STOCK_ON_FIRST_PAGE');
  assert.equal(JSON.stringify(report).includes('SYNTHETIC'), false);
  assert.equal(openfigi.validate({ data: [
    { name: 'Otra empresa', securityType2: 'Common Stock', figi: 'SYNTHETIC' },
  ] }), false);
  assert.equal(openfigi.validate({ data: [
    { name: 'INDITEX SA', securityType2: 'Common Stock', figi: 'SYNTHETIC' },
  ] }), true);
});
