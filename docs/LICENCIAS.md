# Licencias y derechos de uso

**Revisión:** 2026-10-02. El repositorio se ha creado público por elección del propietario. Publicar su código no concede por sí solo permiso para publicar datos de un proveedor ni fija una licencia de reutilización del proyecto. Todavía no se ha añadido una licencia propia al repositorio.

## Bibliotecas directas del armazón

Se inspeccionaron las licencias declaradas en los `package.json` instalados tras generar e instalar la aplicación. Las versiones concretas están fijadas en `app/package-lock.json`; las licencias de dependencias transitivas y cualquier cambio futuro se revisarán antes de una publicación operativa.

| Biblioteca | Licencia declarada | Uso |
|---|---|---|
| React y React DOM | MIT | Interfaz. |
| Vite, plugin oficial de React y Vitest | MIT | Compilación y pruebas. |
| Plugin Vite de Cloudflare y plugin Vitest de Cloudflare | MIT | Integración de Worker. |
| Wrangler | MIT OR Apache-2.0 | Herramienta de Worker. |
| Tipos de Cloudflare Workers | MIT OR Apache-2.0 | Tipos en desarrollo. |
| TypeScript | Apache-2.0 | Tipos y compilación. |
| Oxlint, tipos de Node, React y React DOM | MIT | Análisis y tipos. |
| Zod | MIT | Esquemas y validación en ejecución. |
| jose | MIT | Verificación de JWT y claves públicas JWKS. |

La lista corresponde a dependencias directas observadas. No es un informe exhaustivo de todos los paquetes transitivos. Las versiones y condiciones deben revisarse de nuevo si cambia el archivo de bloqueo.

## Fuentes financieras y calendarios

| Fuente | Regla documental para este proyecto | Pendiente antes de integrar |
|---|---|---|
| [OpenFIGI](https://www.openfigi.com/docs/terms-of-service) | Los identificadores FIGI están dedicados al dominio público; su [FAQ](https://www.openfigi.com/about/faq) describe la simbología como reutilizable. | Revisar el alcance de los campos descriptivos concretos antes de conservar respuestas completas; probar identidad y rate limit desde Worker. No es licencia de cotizaciones. |
| [Euronext](https://www.euronext.com/en/data/real-time-data/pricing-specs-agreements/market-data-pricing-policies) | El uso interno de datos retrasados no tiene tarifa de mercado; el tiempo real y la redistribución tienen condiciones distintas. | Encontrar una vía técnica gratuita y permiso de uso del proveedor para visualización privada; no inferirlo de la política de la bolsa. |
| [BME](https://www.bolsasymercados.es/en/bme-exchange/prices-and-markets/market-data-services/documentation/data-feeds.html) | Su marco vigente distingue recepción, visualización, uso no visual y tarifas; la web de cotizaciones exige autorización para uso comercial o redistribución. | Verificar derechos y vía automatizada aplicables a esta app personal antes de integrar precios españoles. |
| [JPX/J-Quants](https://jpx-jquants.com/en?lang=en) | La página y FAQ actuales indican uso para particulares, doce semanas de retraso en Free y restricciones a compartir datos visibles con terceros. | Confirmar condiciones en cuenta real; no emplearlo para precio reciente. |
| [EODHD](https://eodhd.com/financial-apis/terms-conditions) | Permite análisis privado a particulares y restringe compartir, redistribuir y mostrar información; una [demo local](evidencias/F02_PRECIOS_Y_CUENTAS.md) solo prueba la forma del histórico. | Aclarar si la visualización exclusivamente del titular en esta web está permitida, y la retención exacta, antes de activar cualquier dato. |
| [FMP](https://site.financialmodelingprep.com/developer/docs/pricing) | Su propia página exige acuerdo específico para mostrar o redistribuir datos, incluso al presentar el plan Basic gratuito. | No habilitar visualización sin acuerdo; además verificar las capacidades realmente incluidas en Basic. |
| [CNMV](https://www.cnmv.es/portal/utilidades/notalegal?lang=es) | Permite consultas privadas, con condiciones adicionales para otros usos; el acceso programático local al índice de informes [falló](evidencias/F02_PRECIOS_Y_CUENTAS.md) con Node. | Verificar un canal automatizado permitido y estable antes de usarlo como adaptador. |
| [Finnhub](https://finnhub.io/terms-of-service) | Los planes personales restringen compartir acceso o redistribuir datos y resultados derivados. | Aceptación de la cuenta real, derecho de visualización privada, almacenamiento y retención por endpoint. |
| [Alpaca](https://docs.alpaca.markets/us/docs/about-market-data-api) | El plan Basic y su feed IEX no equivalen a datos consolidados. | Revisar términos de mercado y derechos concretos de uso, caché y visualización personal. |
| [SEC](https://www.sec.gov/about/developer-resources) | Acceso público automatizado sujeto a sus reglas de identificación y uso justo. | Usuario de contacto y política de conservación/aplicación de cada documento. |
| [Fed](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) y [BCE](https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html) | Disponibilidad pública de páginas comprobada localmente. | Condiciones de automatización y uso de contenidos antes de normalizar eventos en la app. |

No versionar respuestas crudas, capturas ni resultados financieros reales de fuentes con permiso no demostrado. Usar fixtures sintéticos inequívocos en CI. Un acceso HTTP 200 no demuestra licencia.
