import { parseArgs } from 'node:util';
import { createProbes } from './probes.mjs';
import { runProbes } from './runner.mjs';

try {
  const { values } = parseArgs({ options: {
    live: { type: 'boolean', default: false },
    case: { type: 'string', multiple: true },
    'max-requests': { type: 'string', default: '3' },
    query: { type: 'string', default: 'Apple' },
    symbol: { type: 'string', default: 'AAPL' },
    cik: { type: 'string', default: '0000320193' },
    days: { type: 'string', default: '5' },
    years: { type: 'string', default: '2' },
    from: { type: 'string', default: '2026-10-01' },
    to: { type: 'string', default: '2026-10-02' },
  } });
  if (values.live && !values.case?.length) throw new Error('El modo vivo exige casos explícitos.');
  let probes = createProbes(values);
  if (values.case) {
    if (values.case.some((id) => !probes.some((probe) => probe.id === id))) {
      throw new Error('Caso desconocido.');
    }
    probes = probes.filter((probe) => values.case.includes(probe.id));
  }
  const report = await runProbes(probes, {
    live: values.live, maxRequests: Number(values['max-requests']),
  });
  console.log(JSON.stringify(report, null, 2));
  if (values.live && report.results.some((result) => result.status !== 'PROBADO')) {
    process.exitCode = 2;
  }
} catch {
  console.error('No se pudo ejecutar la prueba. Revisa los argumentos y la guía; no se muestran datos sensibles.');
  process.exitCode = 1;
}
