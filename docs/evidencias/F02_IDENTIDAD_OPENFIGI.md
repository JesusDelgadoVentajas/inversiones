# F02: prueba local de búsqueda de instrumentos con OpenFIGI

**Fecha:** 2026-10-02. **Alcance:** consultas locales, sin clave y con presupuesto de cinco búsquedas por minuto; ninguna llamada desde Cloudflare ni integración en la aplicación. No se guardaron respuestas completas. [Documentación de la API](https://www.openfigi.com/api/documentation), [condiciones](https://www.openfigi.com/docs/terms-of-service) y [preguntas frecuentes sobre reutilización](https://www.openfigi.com/about/faq).

OpenFIGI documenta una API gratuita de búsqueda y mapeo de instrumentos. Sin clave, la búsqueda permite cinco solicitudes por minuto y hasta cien resultados por página. FIGI sirve para identificar **instrumentos**; no aporta precio, histórico, noticias ni cuentas. Sus condiciones dedican los identificadores FIGI al dominio público; antes de guardar campos adicionales de la respuesta debe revisarse su alcance de reutilización.

| Consulta local a `POST /v3/search` | Resultado observado |
|---|---|
| `Apple`, `Inditex`, `ASML` y `Toyota`, con sector `Equity` | HTTP 200 en las cuatro; primera página de cien resultados y paginación adicional. Los primeros candidatos mezclan bolsas, tipos de instrumento o emisores; no prueban que el primer resultado sea la acción buscada. |
| `Inditex` sin filtro | HTTP 200; los cien resultados de la primera página eran futuros. |
| `Inditex` con `securityType2=Common Stock` | HTTP 200; cero resultados. Añadir `micCode=XMAD` tampoco produjo resultados. |
| `INDUSTRIA DE DISENO TEXTIL` con `securityType2=Common Stock` | HTTP 200; aparecieron acciones con ese nombre legal, incluidas varias cotizaciones. La selección del mercado correcto sigue pendiente. |

**Conclusión:** `OpenFIGI` es un candidato verificable para enriquecer o confirmar la identidad de un instrumento una vez resuelto el nombre del emisor. La búsqueda por nombre coloquial, que exige el producto, **no queda demostrada**: «Inditex» no llevó a su acción ordinaria en esta prueba. No se activará un adaptador ni se marcará F02.03 completa sin resolver alias, distinguir emisor de instrumento y probar las bolsas de la muestra, incluida la ejecución desde un Worker protegido. Los resultados de esta sonda son solo observaciones del 2026-10-02; el orden y la cobertura pueden cambiar.

La sonda reproducible `experiments/provider-spike/cli.mjs` se amplió con `openfigi-search`, siempre bajo `--live`, `--max-requests` y sin guardar el cuerpo. A las 16:23 UTC, una llamada para `Apple` devolvió HTTP 200, 25.527 bytes y al menos una acción ordinaria cuyo nombre contenía «Apple» en la primera página; una llamada para `Inditex` devolvió HTTP 200, 24.073 bytes y ninguna acción ordinaria que coincidiese por nombre en esa página. La versión final de la sonda clasifica este último caso como `NO_MATCHING_COMMON_STOCK_ON_FIRST_PAGE`, no como cotización ni como identidad confirmada. La forma del POST y ese fallo se prueban con fixture sintético en la suite unitaria.

La muestra se amplió con cinco consultas locales más a las 16:30–16:31 UTC, separadas al menos 13 segundos para respetar el límite sin clave. Todas respondieron HTTP 200; el criterio de la sonda exige una acción ordinaria cuyo nombre contenga literalmente la consulta, sin certificar la bolsa:

| Nombre buscado | Coincidencia básica en primera página | Límite de la observación |
|---|---|---|
| Alphabet | No | Clase A/C y emisor sin resolver. |
| Berkshire Hathaway | No | Clase A/B sin resolver. |
| Santander | No | Emisor y bolsa española sin resolver. |
| ASML | Sí | Puede haber varias cotizaciones; no se seleccionó mercado. |
| Toyota | Sí | Puede haber acción local y ADR; no se seleccionó mercado. |

La falta de coincidencia literal no prueba ausencia del instrumento en OpenFIGI, pero sí que este flujo de una sola página y sin alias no satisface la búsqueda abierta del producto.

## Restricciones documentales de otras fuentes

- [Alpha Vantage](https://www.alphavantage.co/support/) documenta 25 solicitudes diarias en la clave gratuita estándar y exige acceso premium para cotizaciones estadounidenses en tiempo real o con 15 minutos de retraso. No resuelve por sí solo el precio reciente de uso frecuente.
- [Twelve Data Basic](https://twelvedata.com/pricing) figura como gratuito, pero su tabla lo clasifica como **internal non-display**; la visualización interna aparece en Grow. Su [guía de uso personal](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage) exige revisar el caso concreto. No se aprueba Basic para mostrar cotizaciones en la interfaz sin permiso claro.
- [Alpaca Basic](https://docs.alpaca.markets/us/docs/about-market-data-api) documenta precio estadounidense en tiempo real solo para el feed IEX, no para todas las bolsas de EE. UU.; necesita cuenta y claves para probar derechos y respuesta real.
- [Euronext](https://www.euronext.com/en/data/real-time-data/pricing-specs-agreements/market-data-pricing-policies) permite uso interno de datos retrasados sin tarifa de mercado y distingue la visualización de su redistribución. Esa política no aporta por sí misma un endpoint gratuito ni permiso de un proveedor concreto para que esta web reciba y muestre datos; el uso privado y la ruta técnica siguen sin probarse.
- [BME](https://www.bolsasymercados.es/en/bme-exchange/prices-and-markets/market-data-services/documentation/data-feeds.html) publica un marco contractual vigente para la recepción y el uso de datos, con apartados de visualización, uso no visual y tarifas. La [ficha pública de Inditex](https://www.bolsasymercados.es/en/bme-exchange/prices-and-markets/shares/detail.ind-de-diseno-textil-inditex-es0148396007.html) exige autorización para uso comercial o redistribución. Consultar una página pública no prueba acceso automatizado, precio reciente gratuito ni permiso para integrarlo en el Worker.
- [JPX/J-Quants](https://jpx-jquants.com/en?lang=en) ofrece plan sin coste para particulares, con cinco llamadas por minuto y doce semanas de retraso; su FAQ confirma que el precio del día no está disponible en ese plan y restringe compartir los datos visibles con terceros. Puede servir para histórico personal, no para el precio reciente pedido; tampoco se ha creado una cuenta ni probado la API.

Estas comprobaciones son documentales, salvo las consultas locales a OpenFIGI. **No** demuestran una fuente gratuita de precio reciente, mundial y apta para esta web. G-DATOS permanece pendiente.
