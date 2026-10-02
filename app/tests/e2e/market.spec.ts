import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { candidate, history } from '../fixtures/market.js'
import { quoteBlock, requestId } from '../fixtures/contracts.js'

async function mockMarket(page: Page) {
  const data = candidate()
  await page.route('**/api/health', (route) => route.fulfill({ json: {
    status: 'operativa', liveData: true, searchAvailable: true, message: 'Prueba sintética de navegador',
  } }))
  await page.route('**/api/v1/listings/*/profile', (route) => route.fulfill({ json: {
    company: data.company, listing: data.listings[0],
    sources: [{ provider: 'synthetic-provider', verifiedAt: '2026-10-02T10:00:00Z' }],
  } }))
  await page.route('**/api/v1/listings/*/quote', (route) => route.fulfill({ json: quoteBlock }))
  await page.route('**/api/v1/listings/*/prices?*', (route) => route.fulfill({ json: { ...quoteBlock, data: history } }))
  return data
}

test('la app real sigue inerte y sin consultas de empresa', async ({ page }) => {
  let searches = 0
  page.on('request', (request) => { if (request.url().includes('/api/v1/search')) searches += 1 })
  await page.goto('/')
  await expect(page.getByLabel('Nombre de la empresa')).toBeDisabled()
  expect(searches).toBe(0)
})

test('busca nombres nuevos y permite abrir el instrumento con teclado', async ({ page }) => {
  await mockMarket(page)
  await page.route('**/api/v1/search?*', (route) => {
    const query = new URL(route.request().url()).searchParams.get('q') ?? ''
    return route.fulfill({ json: { ...quoteBlock, data: [candidate(query)] } })
  })
  await page.goto('/')
  const input = page.getByLabel('Nombre de la empresa')
  await input.fill('Emisor nuevo de prueba')
  const result = page.getByRole('link', { name: /Emisor nuevo de prueba/ })
  await expect(result).toBeVisible()
  await input.press('ArrowDown')
  await expect(result).toBeFocused()
  await result.press('Enter')
  await expect(page.getByRole('heading', { name: 'Precio', exact: true })).toBeVisible()
  await expect(page.getByText('12,34 GBX · GBP')).toBeVisible()
  await expect(page.getByText(/Observado:/)).toContainText('2 oct 2026')
  await page.getByText('Ver los valores en una tabla').click()
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.locator('svg circle')).toHaveCount(2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: `test-results/ficha-${page.viewportSize()?.width}.png`, fullPage: true })
})

test('una respuesta antigua no reemplaza la búsqueda nueva', async ({ page }) => {
  await mockMarket(page)
  await page.route('**/api/v1/search?*', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('q') ?? ''
    if (query === 'Antigua') await new Promise((resolve) => setTimeout(resolve, 700))
    try { await route.fulfill({ json: { ...quoteBlock, data: [candidate(query)] } }) }
    catch { /* La petición antigua puede haber sido cancelada por el navegador. */ }
  })
  await page.goto('/')
  const input = page.getByLabel('Nombre de la empresa')
  const first = page.waitForRequest((request) => request.url().includes('/search?q=Antigua'))
  await input.fill('Antigua')
  await first
  await input.fill('Nueva')
  await expect(page.getByRole('link', { name: /Nueva/ })).toBeVisible()
  await page.waitForTimeout(750)
  await expect(page.getByRole('link', { name: /Antigua/ })).toHaveCount(0)
})

test('un fallo de precio conserva su observación y un histórico ausente no genera curva', async ({ page }) => {
  const data = await mockMarket(page)
  await page.route('**/api/v1/listings/*/prices?*', (route) => route.fulfill({ json: {
    ...quoteBlock, data: null, provenance: [], status: 'unavailable', reasonCode: 'HISTORY_NOT_COVERED',
  } }))
  await page.goto(`/listings/${data.listings[0].id}`)
  await expect(page.getByText(/Observado:/)).toBeVisible()
  const observed = await page.getByText(/Observado:/).textContent()
  await page.route('**/api/v1/listings/*/quote', (route) => route.fulfill({ status: 503, json: {
    code: 'DATA_UNAVAILABLE', message: 'Prueba sintética', requestId, at: '2026-10-02T10:00:00Z', retryable: true,
  } }))
  await page.getByRole('button', { name: 'Actualizar precio' }).click()
  await expect(page.getByText(/Dato guardado:/)).toBeVisible()
  expect(await page.getByText(/Observado:/).textContent()).toBe(observed)
  await expect(page.getByText('La fuente no cubre este histórico.')).toBeVisible()
  await expect(page.locator('svg')).toHaveCount(0)
})

test('suspende refrescos al ocultar la página y reanuda una vez al volver', async ({ page }) => {
  const data = await mockMarket(page)
  let quotes = 0
  await page.route('**/api/v1/listings/*/quote', (route) => { quotes += 1; return route.fulfill({ json: quoteBlock }) })
  await page.clock.install()
  await page.goto(`/listings/${data.listings[0].id}`)
  await expect(page.getByText(/Observado:/)).toBeVisible()
  const initial = quotes
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(61_000)
  expect(quotes).toBe(initial)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect.poll(() => quotes).toBe(initial + 1)
})

test('respeta la próxima actualización permitida y muestra sesión desconocida sin inferirla', async ({ page }) => {
  const data = await mockMarket(page)
  await page.clock.install()
  await page.route('**/api/v1/listings/*/quote', (route) => route.fulfill({ json: {
    ...quoteBlock, data: { ...quoteBlock.data, session: 'unknown' },
    nextAllowedRefreshAt: new Date(Date.now() + 1500).toISOString(),
  } }))
  await page.goto(`/listings/${data.listings[0].id}`)
  await expect(page.getByText('Sesión desconocida')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Actualizar precio' })).toBeDisabled()
  await page.clock.runFor(2000)
  await expect(page.getByRole('button', { name: 'Actualizar precio' })).toBeEnabled()
})

test('una sesión caducada detiene consultas y ofrece navegación para volver a entrar', async ({ page }) => {
  const data = await mockMarket(page)
  await page.clock.install()
  await page.goto(`/listings/${data.listings[0].id}`)
  await expect(page.getByText(/Observado:/)).toBeVisible()
  let rejected = 0
  await page.route('**/api/v1/listings/*/quote', (route) => {
    rejected += 1
    return route.fulfill({ status: 401, json: { code: 'ACCESS_TOKEN_MISSING', message: 'Prueba sintética',
      requestId, at: '2026-10-02T10:00:00Z', retryable: false } })
  })
  await page.getByRole('button', { name: 'Actualizar precio' }).click()
  await expect(page.getByRole('link', { name: 'Volver a iniciar sesión' })).toHaveAttribute('href', `/listings/${data.listings[0].id}`)
  await expect(page.getByRole('button', { name: 'Actualizar precio' })).toBeDisabled()
  await page.clock.runFor(91_000)
  expect(rejected).toBe(1)
})
