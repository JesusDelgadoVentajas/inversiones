import { setTimeout as delay } from 'node:timers/promises';

const contentTypes = { json: 'application/json', html: 'text/html', ics: 'text/calendar' };

async function readLimited(response, maxBytes) {
  const reader = response.body?.getReader();
  if (!reader) return { text: '', bytes: 0 };
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new Error('RESPONSE_TOO_LARGE');
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  return { text: Buffer.concat(chunks).toString('utf8'), bytes };
}

export async function runProbes(probes, {
  live = false, maxRequests = 3, env = process.env,
  fetcher = fetch, sleep = delay, timeoutMs = 10_000, maxBytes = 2_000_000,
} = {}) {
  if (!Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 10) {
    throw new Error('El presupuesto debe ser un entero entre 1 y 10 peticiones.');
  }
  const results = [];
  const stoppedProviders = new Set();
  let requests = 0;
  for (const probe of probes) {
    const result = {
      id: probe.id, provider: probe.provider, capability: probe.capability,
      environment: 'local', checkedAt: new Date().toISOString(),
    };
    const missing = Object.values(probe.credentials).filter((key) => !env[key]?.trim());
    if (missing.length) {
      results.push({ ...result, status: 'OMITIDO', reason: 'MISSING_CONFIGURATION', missing });
      continue;
    }
    if (probe.provider === 'sec' && !/\S+@\S+\.\S+/.test(env.SEC_USER_AGENT)) {
      results.push({ ...result, status: 'OMITIDO', reason: 'SEC_CONTACT_REQUIRED' });
      continue;
    }
    if (!live) {
      results.push({ ...result, status: 'PLANIFICADO', reason: 'DRY_RUN' });
      continue;
    }
    if (stoppedProviders.has(probe.provider) || requests >= maxRequests) {
      results.push({ ...result, status: 'OMITIDO', reason: 'REQUEST_BUDGET_OR_PROVIDER_STOP' });
      continue;
    }
    if (requests > 0) await sleep(1100);
    const headers = { Accept: contentTypes[probe.format] };
    for (const [header, key] of Object.entries(probe.credentials)) headers[header] = env[key];
    const init = { headers, signal: AbortSignal.timeout(timeoutMs), redirect: 'error' };
    if (probe.method === 'POST') {
      headers['Content-Type'] = 'application/json';
      init.method = 'POST';
      init.body = JSON.stringify(probe.body);
    }
    const start = performance.now();
    requests += 1;
    try {
      const response = await fetcher(probe.url, init);
      result.httpStatus = response.status;
      if (!response.ok) {
        await response.body?.cancel();
        if ([401, 403, 429].includes(response.status)) stoppedProviders.add(probe.provider);
        results.push({ ...result, status: 'FALLO', reason: `HTTP_${response.status}` });
        continue;
      }
      const expected = contentTypes[probe.format];
      if (!response.headers.get('content-type')?.toLowerCase().includes(expected)) {
        await response.body?.cancel();
        results.push({ ...result, status: 'FALLO', reason: 'CONTENT_TYPE_MISMATCH' });
        continue;
      }
      const body = await readLimited(response, maxBytes);
      const data = probe.format === 'json' ? JSON.parse(body.text) : body.text;
      const summary = probe.summarize?.(data);
      const valid = Boolean(probe.validate(data, summary));
      results.push({ ...result, bytes: body.bytes, status: valid ? 'PROBADO' : 'FALLO',
        reason: valid ? (summary ? 'ACCESS_AND_DATE_EXTRACTION_ONLY' : 'ACCESS_AND_BASIC_SHAPE_ONLY') :
          probe.invalidReason ?? 'INVALID_OR_EMPTY_RESPONSE',
        ...(valid && summary ? { summary } : {}) });
    } catch (error) {
      // No imprimir mensajes del proveedor, URLs con parámetros, cabeceras ni cuerpos.
      const reason = error instanceof Error && error.message === 'RESPONSE_TOO_LARGE'
        ? 'RESPONSE_TOO_LARGE'
        : error instanceof SyntaxError ? 'INVALID_JSON'
        : error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
          ? 'TIMEOUT' : 'TRANSPORT_OR_VALIDATION_ERROR';
      results.push({ ...result, status: 'FALLO', reason });
    } finally {
      results.at(-1).durationMs = Math.round(performance.now() - start);
    }
  }
  return {
    mode: live ? 'live' : 'dry-run', requests,
    scope: 'Prueba local de acceso, forma y, si procede, fechas. No certifica licencia, frescura, cobertura ni Cloudflare.',
    results,
  };
}
