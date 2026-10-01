# Registro de proveedores candidatos

**Fecha de revisión:** 2026-10-01. **Proveedores financieros activos en la aplicación:** ninguno. La pantalla y la ruta `/api/example` usan exclusivamente información sintética y marcada como tal.

| Fuente | Capacidad candidata | Acceso probado | Límite conocido y decisión pendiente |
|---|---|---|---|
| [Finnhub](https://finnhub.io/docs/api/quote) | Búsqueda por nombre, cotizaciones y algunas entradas de métricas. | Sin clave; sonda y validaciones preparadas. | Verificar plan gratuito, países, endpoints, retraso, licencia personal y acceso desde Worker. No compartir datos derivados. |
| [Alpaca Basic](https://docs.alpaca.markets/us/docs/about-market-data-api) | Precio IEX e histórico estadounidense. | Sin claves; sonda de snapshot IEX preparada. | IEX no equivale a todas las bolsas de EE. UU.; verificar feed, últimas barras, condiciones y acceso desde Worker. |
| [SEC EDGAR](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | Presentaciones y datos XBRL de emisores sujetos a sus formularios. | Documentado sin clave; prueba automatizada omitida por falta de un contacto válido. | Identificar CIK, respetar acceso justo y probar llamadas desde Cloudflare. No usar como fuente universal de cotizaciones. |
| [Reserva Federal](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) | Página de reuniones FOMC. | Local: HTTP 200 y forma HTML básica comprobada dos veces. | Falta extraer fechas, cambios y zonas horarias, condiciones de uso automatizado y comprobar Worker. |
| [BCE](https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html) | Página de reuniones del Consejo de Gobierno. | Local: HTTP 200 y forma HTML básica comprobada dos veces. | Falta extraer fechas y estados, condiciones de uso automatizado y comprobar Worker. |
| CNMV y mercados adicionales | Cobertura española y de otros mercados. | No probado. | Investigar fuente concreta, acceso programático y derechos antes de cerrar G-DATOS. |

El [mapa de cobertura](COBERTURA.md) es la fuente principal de resultados por capacidad, mercado y entorno. La [sonda](../experiments/provider-spike/README.md) registra acceso y forma básica sin guardar respuestas comerciales. Las fechas exactas, derechos de visualización, retención y cuotas de un plan personal se documentarán antes de habilitar su adaptador.

No se selecciona un proveedor primario por ahora. La decisión G-DATOS sigue pendiente: debe cubrir el muestreo internacional, uso personal gratuito real, prueba desde Worker protegido y entradas suficientes para las funciones de la ficha. Si el alcance de 0 € resulta insuficiente, se llevará al propietario una conclusión verificable, sin ocultar el hueco.
