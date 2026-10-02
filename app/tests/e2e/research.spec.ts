import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { candidate, history } from '../fixtures/market.js'
import { financials, news } from '../fixtures/research.js'
import { quoteBlock, requestId } from '../fixtures/contracts.js'
import { calculateMetrics } from '../../shared/finance/metrics.js'
import { newsPage } from '../../shared/news/page.js'

async function mockResearch(page: Page) {
  const identity = candidate()
  const listing = identity.listings[0]
  await page.route('**/api/health', (route) => route.fulfill({ json: {
    status: 'operativa', liveData: true, searchAvailable: true, message: 'Prueba sintética',
  } }))
  await page.route('**/api/v1/listings/*/profile', (route) => route.fulfill({ json: {
    company: identity.company, listing, sources: [{ provider: 'synthetic-provider', verifiedAt: quoteBlock.servedAt }],
  } }))
  await page.route('**/api/v1/listings/*/quote', (route) => route.fulfill({ json: quoteBlock }))
  await page.route('**/api/v1/listings/*/prices?*', (route) => route.fulfill({ json: { ...quoteBlock, data: history } }))
  await page.route('**/api/v1/listings/*/metrics', (route) => route.fulfill({ json: {
    ...quoteBlock, status: 'partial', reasonCode: 'PARTIAL_METRICS',
    data: calculateMetrics({ company: identity.company, listing, facts: financials, asOf: '2026-10-02T12:00:00Z' }),
  } }))
  await page.route('**/api/v1/companies/*/financials', (route) => route.fulfill({ json: { ...quoteBlock, data: financials } }))
  await page.route('**/api/v1/companies/*/news?*', (route) => {
    const url = new URL(route.request().url())
    return route.fulfill({ json: { ...quoteBlock, data: newsPage(Array.from({ length: 23 }, (_, i) => news(i,
      i === 22 ? { kind: 'corporate', publishedAt: null, publishedDate: '2026-09-20' } : {})), {
      companyId: identity.company.id, kind: url.searchParams.get('kind') ?? 'all',
      cursor: url.searchParams.get('cursor'), asOf: '2026-10-02T12:00:00Z',
    }) } })
  })
  await page.goto('/listings/' + listing.id)
  return identity
}

test('muestra métricas exactas, ausencia explicada y documentos, sin consultar secciones ocultas', async ({ page }) => {
  let researchCalls = 0
  page.on('request', (request) => { if (/\/(metrics|financials|news)(\?|$)/.test(request.url())) researchCalls += 1 })
  await mockResearch(page)
  await expect(page.getByRole('heading', { name: 'Precio', exact: true })).toBeVisible()
  expect(researchCalls).toBe(0)
  await page.getByRole('button', { name: 'Cuentas y métricas', exact: true }).click()
  const margin = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Margen bruto', exact: true }) })
  await expect(margin.getByText('40 %', { exact: true })).toBeVisible()
  await margin.getByText('Cómo se calcula').click()
  await expect(margin.getByRole('link', { name: 'synthetic-provider' }).first()).toHaveAttribute('href', 'https://example.org/source')
  await page.getByLabel('Mostrar métricas').selectOption('missing')
  await expect(page.getByRole('heading', { name: 'PER histórico', exact: true })).toBeVisible()
  await page.getByText('Ver cuentas originales normalizadas').click()
  await expect(page.getByRole('table')).toContainText('Hora desconocida')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/metricas-' + page.viewportSize()?.width + '.png', fullPage: true })
})

test('filtra y pagina noticias, conserva fecha sin hora y no confunde fallo con vacío', async ({ page }) => {
  await mockResearch(page)
  await page.getByRole('button', { name: 'Noticias', exact: true }).click()
  await expect(page.locator('.news-list li')).toHaveCount(20)
  await page.getByRole('button', { name: 'Ver más noticias' }).click()
  await expect(page.locator('.news-list li')).toHaveCount(3)
  await page.getByLabel('Tipo de publicación').selectOption('corporate')
  await expect(page.locator('.news-list li')).toHaveCount(1)
  await expect(page.getByText(/Hora y zona desconocidas/)).toBeVisible()
  const original = await page.locator('.news-list').textContent()
  await page.route('**/api/v1/companies/*/news?*', (route) => route.fulfill({ status: 503, json: {
    code: 'DATA_UNAVAILABLE', message: 'Prueba sintética', requestId, at: quoteBlock.servedAt, retryable: true,
  } }))
  await page.getByRole('button', { name: 'Actualizar noticias' }).click()
  await expect(page.getByText(/Información guardada:/)).toBeVisible()
  expect(await page.locator('.news-list').textContent()).toBe(original)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/noticias-' + page.viewportSize()?.width + '.png', fullPage: true })
})
