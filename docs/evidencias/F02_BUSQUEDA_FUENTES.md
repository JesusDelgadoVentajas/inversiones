# F02 — Búsqueda y pruebas de fuentes adicionales

**Fecha:** 2026-10-02; ensayos locales entre 21:18 y 21:34 UTC. **Encargo:** encontrar y comprobar fuentes gratuitas; parar y comunicar el resultado antes de integrar o continuar F06–F08.

## Conclusión

Se encontraron **dos APIs accesibles sin cuenta ni tarjeta**, Stocklake y TGMCharts, y se comprobaron respuestas financieras reales. Esto mejora la evidencia anterior, que solo acreditaba una demo de precios. **No se ha encontrado ni aprobado una combinación que satisfaga todavía búsqueda abierta por nombre, cotizaciones recientes con procedencia completa y la muestra internacional del producto.**

TGMCharts merece conservarse como **candidato auxiliar para cuentas y series de métricas de valores cotizados en EE. UU.** Stocklake sirve para explorar cobertura, pero no se selecciona como fuente principal: fallan nombres corrientes, faltan detalles de observación del precio y su histórico mezcla proveedores sin identificar ajustes. No se da por verificada la fiabilidad de las cifras porque el servidor responda.

No se creó ninguna cuenta, activó suscripción, desplegó Worker, añadió adaptador ni modificó la aplicación. G-DATOS y G-ACCESO permanecen pendientes. El siguiente trabajo requiere un nuevo encargo del propietario.

## Método y presupuesto

- Consultar documentación, precios y condiciones oficiales; no usar recomendaciones de terceros como prueba de cobertura o licencia.
- Solicitudes HTTPS locales con timeout de 20 segundos y lectura acotada; sin reintentos ante denegación, sin claves ajenas y sin elusión de controles.
- Stocklake: **20 invocaciones** `tools/call`, además de cinco inicializaciones y una consulta de catálogo MCP. El contador observado pasó de 25 a 6: una búsqueda fallida inicial no descontó cuota y las otras 19 invocaciones sí. Se paró con seis unidades restantes; no se provocó 429 ni se midió concurrencia.
- TGMCharts: **ocho GET** de API, contando OpenAPI y el diagnóstico de frescura. Siete HTTP 200 y un HTTP 404. Sin clave, no se observaron cabeceras de cuota por cuenta; el límite anunciado no se sometió a una prueba de agotamiento.
- Se contrastaron dos cotizaciones estadounidenses con una consulta secundaria, sin atribuir independencia de origen ni tomar coincidencia numérica como certificación. No se ensayó desde Cloudflare ni desde el móvil.
- Los cuerpos se inspeccionaron temporalmente en `.local/`, excluido de Git, y se eliminaron al cerrar. Esta evidencia conserva resultados de acceso, estructura, fechas y limitaciones; no publica precios, titulares ni respuestas financieras completas.

## Stocklake: resultados locales

Referencias: [acceso y cuotas](https://api.stocklake.dev/docs), [contratos publicados](https://api.stocklake.dev/docs/tools), [condiciones](https://api.stocklake.dev/legal).

Endpoint: `POST https://api.stocklake.dev/mcp`, JSON-RPC/MCP `2025-11-25`, herramientas `get_stock`, `get_stock_history` y `get_stock_news`. Se probaron como invitado, sin credenciales. La cuota gratuita documentada es 25/día como invitado y 200/día con cuenta Free; las operaciones por lotes descuentan por instrumento devuelto. **No se abrió cuenta ni prueba Pro**, que puede pasar a cobro.

### Búsqueda y selección

| Entrada real a `get_stock.symbol` | Resultado | Mercado, moneda y límite observado |
|---|---|---|
| `Apple` | `symbol_not_found` | La marca habitual no se resolvió. |
| `Apple Inc`, `AAPL` | `AAPL`, Apple Inc. | `NMS`, USD; no entrega MIC ni identificador normalizado de clase. |
| `Microsoft` | `MSFT`, Microsoft Corporation | `NMS`, USD; resolución por nombre acreditada para este caso. |
| `Inditex` | `symbol_not_found` | No resuelve el nombre que usaría habitualmente el propietario. |
| `Industria de Diseño Textil`, `ITX.MC` | `ITX.MC`, Industria de Diseño Textil, S.A. | `MCE`, EUR, país Spain. El nombre con tilde funciona; no se verificó su MIC/ISIN mediante una segunda fuente. |
| `Banco Santander`, `SAN.MC` | `symbol_not_found` | No cubierto en estas consultas; no prueba ausencia de otros instrumentos de Santander. |
| `ASML` | `ASML`, ASML Holding N.V. | `NMS`, USD, país Netherlands: **cotización estadounidense**, no prueba Ámsterdam. |
| `ASML.AS` | `symbol_not_found` | No se obtuvo la cotización local europea buscada. |
| `SAP.DE` | `SAP.DE`, SAP SE | `GER`, EUR, país Germany; otra cotización europea respondió. |
| `Toyota Motor Corporation` | `TM`, Toyota Motor Corporation | `NYQ`, USD, país Japan: cotización estadounidense; tipo/ratio de certificado no verificados. **No acredita precio japonés.** |
| `7203.T` | `symbol_not_found` | No se obtuvo la cotización local japonesa buscada. |
| `Alphabet` | `symbol_not_found` | No se resolvieron clases A/C. |
| `Berkshire Hathaway` | `BRK-B`, Berkshire Hathaway Inc. | `NYQ`, USD; devuelve una clase sin ofrecer selección A/B. |

El catálogo MCP anuncia resolución por nombre cuando es única. La prueba muestra que no equivale a búsqueda abierta con candidatos y selección de bolsa/clase. `ASML` coincide además con un símbolo: ese éxito no acredita por sí solo resolución lingüística. El país de la empresa no sustituye al mercado del instrumento.

### Precio, histórico y noticias

| Capacidad | Acceso y comprobación | Datos conservados por el contrato / huecos |
|---|---|---|
| Precio/perfil, `get_stock` | HTTP 200 y precios positivos para Apple, Microsoft, Inditex, SAP y cotizaciones estadounidenses de ASML, Toyota y Berkshire. | Moneda, alias de bolsa, nombre y `updated_at`. **Sin feed del precio ni hora de operación/observación, sesión, MIC, ISIN o tipo de certificado.** `updated_at` se documenta como actualización de datos; no se transforma en hora de cotización. |
| Histórico Apple, `get_stock_history`, `days=5` | Cinco barras, 28-09 a 02-10-2026. | OHLCV y fecha; origen por barra `ibkr`; ajuste, zona/sesión y moneda no declarados en el histórico. |
| Histórico Apple, `days=365` | **365 barras**, 22-04-2025 a 02-10-2026; fechas únicas ascendentes y relaciones OHLC válidas. Respuesta de 121.215 bytes. | Fuentes por barra `ibkr` y `yahoo`. No se pueden tratar como una única serie homogénea sin verificar equivalencia, moneda y ajustes. No se aprueba la dependencia de Yahoo por estar detrás de otro servicio. |
| Histórico Inditex, `days=5` | Cinco barras, 28-09 a 02-10-2026; fechas únicas ascendentes y OHLC coherente. | Origen por barra `ibkr`; las mismas ausencias de ajuste, moneda y sesión. |
| Noticias Apple, `get_stock_news`, `days=1` | Tres elementos con título y fecha de publicación. | **Sin URL ni medio/original** en los elementos recibidos. Uno era anterior al intervalo estricto de 24 horas respecto de la consulta. No satisface noticias enlazadas y atribuibles, ni se certifica el filtro temporal. |
| Cuentas, calendario, operaciones corporativas, comparables | No ensayados en esta búsqueda. | Campos resumidos y fechas presentes en un perfil no acreditan datos suficientes para 20 métricas ni eventos confirmados. |

El uso personal de herramientas está descrito; se prohíbe redistribuir a terceros. Las condiciones reconocen feeds públicos de terceros, retrasos posibles y derechos de sus propietarios. **PENDIENTE:** base de autorización de esos feeds para el caso concreto, permiso de retención/caché, significado de la actualización, observación y retraso por mercado, ajustes y mapeo de instrumento. La ausencia de estos datos impide aceptar precio «al momento».

Las búsquedas fallidas devolvieron HTTP 200 y un objeto `error`, aunque `isError` era `false`. Un futuro ensayo debe inspeccionar también ese objeto; contar HTTP 200 como éxito ocultaría los fallos anteriores.

## TGMCharts: resultados locales

Referencias: [API y plan Free](https://tgmcharts.com/developers), [condiciones, sección 19](https://tgmcharts.com/terms), [metodología y fuentes](https://tgmcharts.com/methodology), [OpenAPI](https://tgmcharts.com/api/v1/openapi.json).

La API REST funcionó sin clave. Su oferta gratuita anuncia 1.000 unidades/día de uso razonable: JSON cuesta una unidad, imágenes cinco y herramientas MCP dos. MCP exige clave para invocaciones; **solo se probó REST**. Se permite mostrar respuestas en aplicaciones con atribución y enlace a TGMCharts; se restringen reventa masiva y servicios dedicados a servir de nuevo su feed. El repositorio público no debe contener los cuerpos ni sustituir esa atribución.

| Endpoint consultado | Resultado observado | Capacidad acreditada y límite |
|---|---|---|
| `/api/v1/openapi.json` | HTTP 200, contrato accesible. | Cinco familias de rutas: resumen, series, imágenes, estados financieros y MCP. El contrato leído no ofrece búsqueda abierta por nombre. |
| `/api/v1/summary/AAPL`, `/MSFT`, `/BAND` | HTTP 200; Apple, Microsoft y Bandwidth; precios finitos positivos y moneda USD. | Acceso a resúmenes de tres símbolos, incluido uno fuera de los ejemplos habituales. `priceSource=fmp-delayed`, fecha de cierre 02-10-2026. Falta hora de observación del precio y MIC. **No acredita tiempo real ni todos los valores estadounidenses.** |
| `/api/v1/summary/ITX.MC` | HTTP 404. | Inditex de Madrid no cubierta por esta consulta. El alcance documentado es valores cotizados en EE. UU.; un emisor extranjero cotizado allí no probaría su bolsa de origen. |
| `/api/v1/statements/AAPL/income-statement?period=annual&years=2` | HTTP 200; dos ejercicios, 2025 y 2024; USD; periodos y formularios. | Datos declarados como SEC EDGAR XBRL, con etiqueta, accession y fecha de presentación por valor. Se conserva ausencia de conceptos. No se verificaron importes contra los documentos SEC originales ni balance/caja; **20 métricas aún no aceptadas**. |
| `/api/v1/series/AAPL/pe-ratio?years=2` | HTTP 200; **502 puntos**, 02-10-2024 a 02-10-2026; fechas únicas ascendentes; valores finitos o nulos; unidad ratio y base diaria. | Serie de una **métrica calculada**, no histórico OHLC de precio. Su metodología declara supuestos y versiones de presentaciones disponibles; no sustituye los cálculos propios ni garantiza un histórico completo de revisiones. |
| `/api/health/freshness` | HTTP 200; diagnóstico `ok=true`, 1.026 cubiertos y 34 excluidos; cero fuera de su SLA de 26 horas. | Es una declaración del servidor sobre su actualización, no prueba independiente de la última operación ni garantía de cobertura global. No se extrajo ese universo. |

Los resúmenes ofrecen `asOf.dataUpdatedAt`, pero no timestamp de la cotización. En Bandwidth se recibió `16:44:36Z` del 02-10-2026 junto con un cierre etiquetado para ese mismo día. Ese timestamp precede al cierre regular de esa sesión estadounidense: **no puede emplearse como hora de observación de ese cierre**. La consulta secundaria coincidió numéricamente con el precio, pero no explica el significado de ese metadato ni certifica la procedencia. No se afirma que el precio sea falso ni que tenga esa antigüedad.

La API declara actualización diaria y permite caché; las respuestas enviaron cabeceras de caché. **PENDIENTE antes de aprobar un adaptador:** alcance de retención e identidad persistente, condiciones de los datos de terceros frente a los cálculos propios/SEC, cobertura por instrumento, campos ausentes, frescura por bloque y ejecución desde Worker protegido. Esta búsqueda no validó fórmulas ni implementó métricas.

## Otros candidatos contrastados

Estas filas son documentación, salvo los intentos de acceso señalados. No se anuncian como fuentes que funcionan para la app.

| Fuente | Evidencia y conclusión acotada |
|---|---|
| [HF MarketData](https://www.hfmarketdata.io/) | Documentación indexada prometía API gratuita internacional. GET local al dominio y `/v1/status`: fallo TLS; el dominio sin `www` no resolvió. **FALLO_TEMPORAL**, acceso no demostrado; no se eludió el fallo ni se certificó licencia. |
| [stockprices.dev](https://stockprices.dev/) | Página y GET local `/api/stocks/AAPL`: HTTP 403. **ACCESO_DENEGADO** en este entorno; sin prueba de licencia, observación ni cobertura. |
| [OkamiStocks](https://okamistocks.io/) | La modalidad gratuita se limita a diez símbolos de demo, sin histórico. **NO_CUBIERTO** para búsqueda abierta; no se abrió cuenta. |
| [TickerLayer](https://tickerlayer.com/pricing) | Plan gratuito anunciado, pero define sus precios como derivados/indicativos. No acredita una cotización oficial reciente; sin prueba con clave. No se selecciona como fuente principal. |
| [StockData.org](https://www.stockdata.org/pricing) | Cuota gratuita documentada; clave necesaria. Sus [términos](https://www.stockdata.org/tos) requieren aclarar el alcance de automatización frente a su API. No probado ni aprobado. |
| [Tiingo](https://www.tiingo.com/about/pricing) | Starter gratuito requiere cuenta y clave; sus [términos](https://app.tiingo.com/tos/) restringen retención duradera de la modalidad gratuita. No se ensayó ni se acepta para la caché/persistencia existente. |
| [FinancialData.net](https://www.financialdata.net/pricing) | No se acredita que Free incluya la combinación de cotizaciones internacionales, noticias y derechos de display que necesita el proyecto. Sin clave ni prueba. |
| [TradingView widgets](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/) | Alternativa gratuita de **presentación externa**, documentada, sin ensayo de navegador. Su [FAQ](https://www.tradingview.com/widget-docs/faq/data/) confirma que no ofrece API para obtener datos/indicadores; sus [condiciones](https://www.tradingview.com/policies/) distinguen display de procesamiento. No resuelve los adaptadores, cálculo ni gráficos propios. No se modifica la arquitectura. |

Las revisiones anteriores de Alpha Vantage, Twelve Data, Marketstack, EODHD, Finnhub, Alpaca, OpenFIGI y calendarios se conservan en [la cobertura](../COBERTURA.md) y [las otras fuentes](F02_FUENTES_ADICIONALES.md). Los proveedores con clave pendiente no se convierten en descartados técnicos porque no se haya abierto una cuenta.

## Puertas pendientes y parada

Esta parada corresponde al encargo del 02-10-2026. El propietario retomó después F01–F08; [la continuación del 03-10](F01_F08_CONTINUACION.md) conserva los huecos y documenta el trabajo adicional, sin activar estas fuentes.

**PROBADO en local:** acceso financiero no limitado a una clave demo de Apple; varios nombres legales, cotizaciones en USD/EUR, más de un año de barras Apple, noticias sin atribución suficiente, resumen de otra empresa estadounidense y un estado financiero con trazabilidad declarada.

**NO_CUBIERTO en las consultas indicadas:** varios alias cotidianos, selección de clases, Santander Madrid, ASML Ámsterdam y Toyota Japón. **PENDIENTE:** fidelidad/frescura del precio, homogeneidad/ajustes, derechos completos, noticias enlazadas, cuentas para 20 métricas, eventos/comparables y Worker protegido. La muestra internacional y los casos difíciles del plan no están completos.

Si el propietario pide seguir, el siguiente ensayo concreto sería resolver esas carencias o probar una cuenta gratuita de un proveedor autorizado con presupuesto explícito. TGMCharts puede evaluarse aparte para cuentas estadounidenses; añadirlo no resuelve la fuente principal de búsqueda y cotizaciones. **Hasta ese nuevo encargo, parar aquí.**
