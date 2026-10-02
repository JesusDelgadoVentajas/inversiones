# Contratos y API

**Versión de diseño:** `v1`. **Estado 2026-10-02:** contratos y persistencia probados en local; las rutas financieras no están habilitadas. El código de validación está en `app/shared/contracts/` y las migraciones en `app/migrations/`.

## Identidad y datos

`Company` representa al emisor; `Listing`, a un instrumento negociado en un MIC y una moneda; `ProviderMapping`, a la clave propia de una fuente. Cada entidad tiene un UUID interno persistente. Ni el nombre ni el símbolo son claves únicas globales. Un ADR o una clase distinta exige otro `Listing`; CIK y otros identificadores regulatorios pertenecen al emisor cuando corresponda.

Las cantidades exactas se transportan como **cadenas decimales**, sin notación científica ni conversión implícita a `number`. En precios, `unit.currency` identifica la divisa y `unit.unitToMajor` cuántas unidades mayores vale una unidad cotizada: por ejemplo, `GBX` con GBP y `0.01`. Cero es un valor válido para algunas cuentas, pero una cotización vacía o de precio cero no se acepta como precio vivo. Los hechos contables incluyen `sourceScale`; el consumidor no debe aplicar la escala otra vez si `value` ya está normalizado.

Una **fecha civil** usa `YYYY-MM-DD` y no se transforma en UTC. Un **instante** usa ISO 8601 con `Z`; no se acepta un offset local ni una fecha sin zona. `observedAt`, `publishedAt`, `retrievedAt`, `checkedAt` y `servedAt` significan cosas distintas. Servir caché no cambia la observación ni la última comprobación correcta.

Cada `DataBlock<T>` contiene `status`, `data`, `provenance[]`, `servedAt`, `fromCache`, `cacheAgeSeconds`, `nextAllowedRefreshAt`, `warnings[]`, `reasonCode` y `requestId`. Los estados son `available`, `partial`, `unavailable`, `not_applicable`, `stale`, `rate_limited` y `error`. Solo los tres estados con datos llevan `data` no nulo y procedencia; los demás llevan motivo. Un cero válido no sustituye `null`. Métricas con fuentes mixtas conservan procedencia **por entrada**. Los esquemas ejecutables de precio, barra, hecho contable, métrica, noticia, evento, comparable, capacidad y preferencia validan estos límites con fixtures sintéticos.

## Rutas

**Activas en el armazón local:** `GET /api/health` y `GET /api/v1/health` devuelven preparación sin datos; `GET /api/example` devuelve solo una cotización nula sintética. Toda ruta `/api/v1/*` distinta de salud exige JWT de Access incluso con `APP_READY=false`. Sin configuración, devuelve `503 ACCESS_NOT_CONFIGURED`; sin token, `401 ACCESS_TOKEN_MISSING`; con token inválido o identidad ajena, `403 ACCESS_DENIED`. Con identidad válida y la aplicación inactiva, devuelve `503 APP_NOT_READY`. El resto devuelve `404 NOT_FOUND` JSON. No existen aún rutas que consulten un proveedor.

**Contrato previsto para las siguientes fases**, siempre detrás de Access y de `APP_READY=true`:

| Método y ruta | Parámetros y límites previstos | Resultado |
|---|---|---|
| `GET /api/v1/capabilities` | Sin entrada libre de proveedor. | Capacidades realmente aprobadas por mercado y bloque. |
| `GET /api/v1/search?q=` | Texto Unicode recortado, 2–100 caracteres; máximo 20 candidatos. | Empresas e instrumentos separados. |
| `GET /api/v1/listings/:id/profile` | UUID de listing. | Identidad y fuentes. |
| `GET /api/v1/listings/:id/quote` | UUID de listing. | `DataBlock<Quote>`. |
| `GET /api/v1/listings/:id/prices?range=` | UUID; rango permitido `1m`, `3m`, `1y`, `5y` o `max`, sujeto a cobertura. | Barras reales con ajuste identificado. |
| `GET /api/v1/companies/:id/financials` | UUID de emisor; paginación por periodo cuando haga falta. | Hechos y documentos. |
| `GET /api/v1/listings/:id/metrics` | UUID de listing. | Métricas con entradas y versiones. |
| `GET /api/v1/companies/:id/news?cursor=` | UUID; cursor opaco, máximo 20 elementos. | Noticias originales y siguiente cursor. |
| `GET /api/v1/companies/:id/events?listingId=` | UUID de emisor/listing compatible. | Eventos confirmados o ausencias justificadas. |
| `GET /api/v1/macro?regions=` | Códigos de región admitidos, máximo 4. | Eventos macro oficiales. |
| `GET /api/v1/companies/:id/peers` | UUID de emisor, máximo 3 comparables automáticos. | Motivo de cada relación. |
| `GET/PUT /api/v1/preferences` | PUT con cuerpo ≤16 KiB, tipo JSON y versión previa. | Preferencias o conflicto de versión. |
| `POST /api/v1/refresh` | Un bloque y UUID compatibles, cuerpo ≤4 KiB; sin URL libre. | Bloque comprobado una vez dentro de cuota. |

Esta tabla es un **contrato de implementación**, no una afirmación de disponibilidad. Los límites exactos se fijarán con cada ruta real y sus pruebas. Una identidad no encontrada da 404; un bloque conocido sin cobertura puede devolver 200 con `status: unavailable` y `reasonCode`. Los parámetros inválidos dan 400, falta de sesión 401, identidad distinta 403, límite propio 429 y dependencia caída 502/503. Cualquier ruta API desconocida devuelve JSON, nunca el HTML de la SPA.

## Errores y seguridad

Las respuestas de error actuales usan `{code, message, requestId, at, retryable}` con `Cache-Control: private, no-store`. `code` es estable; `message` es genérico y no contiene cuerpos externos, JWT, correo, URL con token ni SQL. Las respuestas privadas futuras conservarán esa política de caché. No se aceptará una URL de proveedor enviada por el cliente; el transporte interno exige origen HTTPS aprobado y no sigue redirecciones.

El JWT se toma de `Cf-Access-Jwt-Assertion` y se valida con firma RS256, JWKS del dominio Access configurado, emisor, audiencia, `exp`, `nbf`, `iat`, tipo `app` y correo del propietario. El dominio se restringe a `*.cloudflareaccess.com`; la ausencia de configuración cierra el acceso. La biblioteca conserva claves públicas en memoria y recarga al vencer/rotar según su política. Esto está probado con claves sintéticas en Workerd; **falta la prueba con Access real**. Referencias: [JWT y JWKS de Cloudflare](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [campos de token](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/) y [protección de Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/).
