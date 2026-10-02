import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import assert from 'node:assert/strict';

// Solo lectura local de un fichero primario y oráculos preparados independientemente.
// No accede a proveedores, no guarda sus cuerpos y no publica cifras en el informe.
const filename = process.argv[2];
if (!filename) throw new Error('Indica un JSON privado con casos y resultados independientes.');
const cases = JSON.parse(await readFile(resolve(filename), 'utf8'));
if (!Array.isArray(cases) || cases.length < 3 || cases.length > 5) throw new Error('Se requieren entre tres y cinco emisores.');
const server = await createServer({ root: resolve(dirname(fileURLToPath(import.meta.url)), '..'),
  configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { normalizeSecConcept } = await server.ssrLoadModule('/worker/normalization/sec-concepts.ts');
  const { calculateMetrics } = await server.ssrLoadModule('/shared/finance/metrics.ts');
  const results = [];
  for (const item of cases) {
    const start = performance.now();
    const facts = item.concepts.flatMap((concept) => normalizeSecConcept(concept.body, {
      companyId: item.company.id, cik: item.cik, tag: concept.body.tag, retrievedAt: item.retrievedAt,
    }).facts.filter((fact) => concept.references.some((reference) =>
      fact.accession === reference.accession && fact.periodStart === reference.start &&
      fact.periodEnd === reference.end && fact.filedDate === reference.filed)));
    const metrics = calculateMetrics({ company: item.company, listing: item.listing, facts, asOf: item.asOf });
    if (Object.keys(item.expected).length < 5) throw new Error('Se requieren cinco oráculos por emisor.');
    for (const [id, expected] of Object.entries(item.expected)) {
      const metric = metrics.find((entry) => entry.id === id);
      assert.equal(metric?.status, 'available', item.symbol + '/' + id);
      assert.equal(metric?.value, expected, item.symbol + '/' + id);
    }
    results.push({ symbol: item.symbol, facts: facts.length, checks: Object.keys(item.expected).length,
      nodeDurationMs: Math.round((performance.now() - start) * 1000) / 1000,
      payloadBytes: Buffer.byteLength(JSON.stringify(metrics)) });
  }
  console.log(JSON.stringify({ environment: 'local-node', results,
    scope: 'Periodos publicados seleccionados, no cotización actual, móvil ni CPU de Cloudflare.' }));
} finally { await server.close(); }
