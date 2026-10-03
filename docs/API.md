# Contratos y API

**Versión de diseño:** `v1`. **Estado 2026-10-03:** rutas de búsqueda/perfil/precio/histórico/cuentas/métricas/noticias implementadas y probadas localmente con fuentes sintéticas. La configuración distribuida mantiene el acceso cerrado y ningún proveedor real activo. El código de validación está en `app/shared/contracts/` y las cinco migraciones en `app/migrations/`.

## Identidad y datos

`Company` representa al emisor; `Listing`, a un instrumento negociado en un MIC y una moneda; `ProviderMapping`, a la clave propia de una fuente. Cada entidad tiene un UUID interno persistente. Ni el nombre ni el símbolo son claves únicas globales. Un ADR o una clase distinta exige otro `Listing`; CIK y otros identificadores regulatorios pertenecen al emisor cuando corresponda.

Las cantidades exactas se transportan como **cadenas decimales**, sin notación científica ni conversión implícita a `number`. En precios, `unit.currency` identifica la divisa y `unit.unitToMajor` cuántas unidades mayores vale una unidad cotizada: por ejemplo, `GBX` con GBP y `0.01`. Cero es un valor válido para algunas cuentas, pero una cotización vacía o de precio cero no se acepta como precio vivo. Los hechos contables incluyen `sourceScale`; el consumidor no debe aplicar la escala otra vez si `value` ya está normalizado.

Una **fecha civil** usa `YYYY-MM-DD` y no se transforma en UTC. Un **instante** usa ISO 8601 con `Z`; no se acepta un offset local ni una fecha sin zona. `observedAt`, `publishedAt`, `retrievedAt`, `checkedAt` y `servedAt` significan cosas distintas. Servir caché no cambia la observación ni la última comprobación correcta.

Cada `DataBlock<T>` contiene `status`, `data`, `provenance[]`, `servedAt`, `fromCache`, `cacheAgeSeconds`, `nextAllowedRefreshAt`, `warnings[]`, `reasonCode` y `requestId`. Los estados son `available`, `partial`, `unavailable`, `not_applicable`, `stale`, `rate_limited` y `error`. Solo los tres estados con datos llevan `data` no nulo y procedencia; los demás llevan motivo. Un cero válido no sustituye `null`. Métricas con fuentes mixtas conservan procedencia **por entrada**. Los esquemas ejecutables de precio, barra, hecho contable, métrica, noticia, evento, comparable, capacidad y preferencia validan estos límites con fixtures sintéticos.

## Rutas

**Públicas en local:** `GET /api/health` y `GET /api/v1/health` devuelven `status`, `liveData`, `searchAvailable` y `message`; con la configuración actual indican preparación sin datos. `GET /api/example` devuelve solo una cotización nula sintética. Toda ruta `/api/v1/*` distinta de salud exige JWT de Access incluso con `APP_READY=false`. Sin configuración, devuelve `503 ACCESS_NOT_CONFIGURED`; sin token, `401 ACCESS_TOKEN_MISSING`; con token inválido o identidad ajena, `403 ACCESS_DENIED`. Con identidad válida y la aplicación inactiva, devuelve `503 APP_NOT_READY`.

**Implementadas en F07–F10**, siempre detrás de Access y de `APP_READY=true`; sin `ALLOW_LIVE_PROVIDERS=true` se usa un registro vacío:

| Método y ruta | Parámetros y límites | Resultado |
|---|---|---|
| `GET /api/v1/capabilities` | Sin entrada libre de proveedor. | Booleanos `search`, `quote`, `history`, `financials`, `news`, según registro, métodos y permiso de retención. El detalle por mercado se añadirá al aprobar fuentes. |
| `GET /api/v1/search?q=` | Un único `q`, normalizado NFC y espacios, 2–80 caracteres Unicode; sin controles/invisibles; máximo 20 candidatos. | `DataBlock<SearchCandidate[]>`, empresas e instrumentos separados; sin mapeos externos en el cliente. |
| `GET /api/v1/listings/:id/profile` | UUID de listing. | Identidad y fuentes. |
| `GET /api/v1/listings/:id/quote` | UUID de listing. | `DataBlock<Quote>`. |
| `GET /api/v1/listings/:id/prices?range=` | UUID; rango `1m`, `3m`, `1y` (predeterminado), `5y` o `max`, sujeto a cobertura; sin otros parámetros. | `DataBlock<PriceHistory>`: rango, rangos disponibles, unidad, feed, resolución, ajuste y 1–2.000 barras homogéneas. |
| `GET /api/v1/companies/:id/financials` | UUID de emisor, sin parámetros libres. | `DataBlock<FinancialFact[]>`, máximo 1.000 hechos y 2 MB; tabla cliente de 40 filas. |
| `GET /api/v1/listings/:id/metrics` | UUID de instrumento, sin otros parámetros. | `DataBlock<Metric[]>`: 32 métricas o bloque ausente; estado/motivo, versión e inputs por cálculo. |
| `GET /api/v1/companies/:id/news?kind=&cursor=` | Tipo all/corporate/independent/regulatory/sector/macro; cursor opcional base64url ≤700, sin duplicados ni otros parámetros. | `DataBlock<NewsPage>`: hasta 20 artículos, siguiente cursor y corte temporal, sobre ventana de hasta 200. |

`profile` devuelve `{company, listing, sources: [{provider, verifiedAt}]}` desde identidad D1 verificada; no depende de caché financiera. La búsqueda guarda esas identidades solo si el registro permite retenerlas; el cliente selecciona un UUID y no puede enviar un emisor o mapeo arbitrario. [Decisión D009](DECISIONES.md#d009--identidad-verificada-y-vistas-locales-antes-de-activar-datos). Un adaptador debe reutilizar IDs estables de su fuente y comprobar emisor/mercado/clase: el contrato validado no demuestra que su contenido externo sea verdadero.

La cotización admite `previousClose` nulo o con unidad, feed, instante, base de acciones y procedencia propios. El cálculo [M01](METRICAS.md) exige compatibilidad. Los históricos rechazan barras mezcladas, duplicadas, invertidas o solapadas; no convierten ausencias en cero. Los bloques sin fuente aprobada devuelven `unavailable / NO_APPROVED_PROVIDER`. Las rutas son GET, limitan la respuesta a 2 MB y devuelven JSON privado sin caché compartida.

**Previstas para fases posteriores**, aún no implementadas:

| Método y ruta | Parámetros y límites previstos | Resultado |
|---|---|---|
| `GET /api/v1/companies/:id/events?listingId=` | UUID de emisor/listing compatible. | Eventos confirmados o ausencias justificadas. |
| `GET /api/v1/macro?regions=` | Códigos de región admitidos, máximo 4. | Eventos macro oficiales. |
| `GET /api/v1/companies/:id/peers` | UUID de emisor, máximo 3 comparables automáticos. | Motivo de cada relación. |
| `GET/PUT /api/v1/preferences` | PUT con cuerpo ≤16 KiB, tipo JSON y versión previa. | Preferencias o conflicto de versión. |
| `POST /api/v1/refresh` | Un bloque y UUID compatibles, cuerpo ≤4 KiB; sin URL libre. | Bloque comprobado una vez dentro de cuota. |

Las rutas futuras constituyen un contrato de implementación. Las ya implementadas tampoco demuestran cobertura externa: el registro real sigue vacío. Una identidad no encontrada da 404; un bloque conocido sin cobertura puede devolver 200 con `status: unavailable` y `reasonCode`. Parámetros inválidos dan 400, métodos no admitidos 405 con `Allow: GET`, falta de sesión 401, identidad ajena 403 y fallo no previsto del servicio 503 saneado. Los límites de proveedor aparecen en el bloque correspondiente. Cualquier ruta API desconocida devuelve JSON, nunca el HTML de la SPA.


## Cuentas, métricas y noticias

Los hechos conservan fecha civil `filedDate` o instante auténtico `filedAt`, criterio contable, atribución, etiqueta, accession y base por acción. Si solo hay fecha, no se fabrica hora. Cada métrica mantiene unidad, emisor/listing, periodo y procedencia por entrada; estado individual disponible/antiguo/no aplicable/ausente. La API de métricas carga bloques independientes y conserva ausencias; no promete 32 valores en toda empresa. [Convenciones y límites](METRICAS.md).

Cotizaciones: `sessionVolume` y `capitalization` opcionales/nulos. Capitalización incluye emisor, valor en moneda mayor, cobertura de todas las clases comunes, observación y fuente propios. No se extrae de un balance. El histórico incluye `coverage: complete | partial | unknown`; por defecto desconocida. Solo cobertura completa acreditada habilita métricas anuales.

La ventana de noticias usa relación verificada con UUID del emisor, tipo explícito, idioma y publicación original; fecha civil conserva precisión desconocida. `dateKind` distingue publicación de presentación regulatoria; recepción EDGAR no se convierte en publicación. El cursor se valida antes de consumir cuota y nunca se reenvía a una API ajena. Su fecha de corte no congela correcciones/descubrimientos posteriores. No hay consultas automáticas de esta sección. [Política de noticias](NOTICIAS.md).

Los agregados tienen plazo compartido de 20 segundos y usan ejecutor/cuotas/caché del adaptador aprobado. No guardan datos financieros nuevos en D1 por sí solos. Una fuente debe acreditar derechos de conservación antes de cachear. Los límites de contrato producen fallo explícito, no truncado silencioso.

## Errores y seguridad

Las respuestas de error usan `{code, message, requestId, at, retryable}` con `Cache-Control: private, no-store`; las respuestas de datos también conservan esa política. `code` es estable; `message` es genérico y no contiene cuerpos externos, JWT, correo, URL con token ni SQL. No se acepta una URL de proveedor enviada por el cliente; el transporte interno exige origen HTTPS aprobado y no sigue redirecciones. La UI detecta HTML de sesión y 401/403, detiene refrescos del bloque afectado y permite navegar de nuevo a la ficha. La sesión real y esa navegación a Access siguen pendientes de F05.

El JWT se toma de `Cf-Access-Jwt-Assertion` y se valida con firma RS256, JWKS del dominio Access configurado, emisor, audiencia, `exp`, `nbf`, `iat`, tipo `app` y coincidencia exacta con uno de los correos autorizados. `ACCESS_ALLOWED_EMAILS` contiene una lista JSON privada de una o dos direcciones válidas; se comparan sin distinguir mayúsculas, sin ampliar por dominio ni alias. Sustituye `ACCESS_OWNER_EMAIL`; este último ya no configura el guard. El dominio se restringe a `*.cloudflareaccess.com`; una configuración ausente o inválida cierra el acceso. La biblioteca conserva claves públicas en memoria y recarga al vencer/rotar según su política. Ambos correos y terceros están probados con claves sintéticas en Workerd; **falta la prueba con Access real**. Referencias: [JWT y JWKS de Cloudflare](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/), [campos de token](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/) y [protección de Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/).
