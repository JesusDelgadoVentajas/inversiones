# Licencias y derechos de uso

**Revisión:** 2026-10-01. El repositorio se ha creado público por elección del propietario. Publicar su código no concede por sí solo permiso para publicar datos de un proveedor ni fija una licencia de reutilización del proyecto. Todavía no se ha añadido una licencia propia al repositorio.

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

La lista corresponde a dependencias directas observadas. No es un informe exhaustivo de todos los paquetes transitivos. Las versiones y condiciones deben revisarse de nuevo si cambia el archivo de bloqueo.

## Fuentes financieras y calendarios

| Fuente | Regla documental para este proyecto | Pendiente antes de integrar |
|---|---|---|
| [Finnhub](https://finnhub.io/terms-of-service) | Los planes personales restringen compartir acceso o redistribuir datos y resultados derivados. | Aceptación de la cuenta real, derecho de visualización privada, almacenamiento y retención por endpoint. |
| [Alpaca](https://docs.alpaca.markets/us/docs/about-market-data-api) | El plan Basic y su feed IEX no equivalen a datos consolidados. | Revisar términos de mercado y derechos concretos de uso, caché y visualización personal. |
| [SEC](https://www.sec.gov/about/developer-resources) | Acceso público automatizado sujeto a sus reglas de identificación y uso justo. | Usuario de contacto y política de conservación/aplicación de cada documento. |
| [Fed](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) y [BCE](https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html) | Disponibilidad pública de páginas comprobada localmente. | Condiciones de automatización y uso de contenidos antes de normalizar eventos en la app. |

No versionar respuestas crudas, capturas ni resultados financieros reales de fuentes con permiso no demostrado. Usar fixtures sintéticos inequívocos en CI. Un acceso HTTP 200 no demuestra licencia.
