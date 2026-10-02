# Cobertura demostrada y pendientes de F02

**Actualizado:** 2026-10-02. **Estado de G-DATOS:** PENDIENTE. Esta matriz distingue acceso a una página de poder mostrar fechas o datos financieros correctos. Las pruebas locales no sustituyen las pruebas desde un Worker protegido.

| Proveedor / plan | Mercado e instrumento | Capacidad y endpoint | Local | Worker | Visualización / retención | Resultado y evidencia |
|---|---|---|---|---|---|---|
| OpenFIGI / sin clave | Multimercado, identificadores de instrumentos | Búsqueda y mapeo `v3/search`, sin precio | PROBADO: acceso y forma básica. NO_CUBIERTO: la primera página de «Inditex» no contenía acciones ordinarias y el filtro por tipo no la encontró. | PENDIENTE. | FIGI abierto; revisar retención de metadatos adicionales antes de guardar respuesta. | [Prueba de identidad](evidencias/F02_IDENTIDAD_OPENFIGI.md); candidato auxiliar, no búsqueda fiable por sí sola. |
| JPX/J-Quants Free | Japón, acciones | Histórico OHLC, datos resumidos y calendario con doce semanas de retraso | PENDIENTE: solo documentación. | PENDIENTE. | Uso personal; restringido compartir datos visibles con terceros. | [Plan y FAQ actuales](https://jpx-jquants.com/en?lang=en); no cubre precio reciente. |
| Fed / página pública | EE. UU., calendario macro | Recurso HTML `fomccalendars.htm` | PROBADO: HTTP 200 y forma básica. | PENDIENTE. | PENDIENTE de revisión para integración. | [Sonda local](evidencias/F01_F03.md), 167.565 bytes; no se extrajeron fechas. |
| BCE / página pública | Eurozona, calendario macro | Recurso HTML `mgcgc/html/index.en.html` | PROBADO: HTTP 200 y forma básica. | PENDIENTE. | PENDIENTE de revisión para integración. | [Sonda local](evidencias/F01_F03.md), 106.266 bytes; no se extrajeron fechas. |
| SEC / API pública | EE. UU., emisor conocido por CIK | Presentaciones `submissions/CIK….json` | PENDIENTE: requiere `SEC_USER_AGENT`. | PENDIENTE. | PENDIENTE de política de conservación. | API sin clave documentada; sin consulta de la sonda. |
| Finnhub / plan por comprobar | Mercados por verificar, acción ordinaria | Búsqueda `search`, precio `quote`, `stock/metric` | PENDIENTE: falta clave. | PENDIENTE. | Uso personal y retención por confirmar en cuenta real. | Sonda preparada; cero consultas. |
| Alpaca Basic / gratuito documentado | EE. UU., IEX | Snapshot `v2/stocks/{symbol}/snapshot?feed=iex` | PENDIENTE: faltan claves. | PENDIENTE. | Derechos de mercado por confirmar. | Sonda preparada; cero consultas. |
| CNMV y otras fuentes por seleccionar | España, otro mercado europeo, Asia | Búsqueda, precio, cuentas y eventos | PENDIENTE. | PENDIENTE. | PENDIENTE. | No hay endpoint aprobado. |

Cada fila de prueba real posterior debe completar las columnas detalladas del [plan, sección 5.4](../PLAN_CONSTRUCCION.md#s05): plan, fecha, país, bolsa/MIC, instrumento, cuota, feed, retraso, divisa, unidad, timestamp de observación, histórico, licencias, conservación y referencia saneada. Una celda vacía nunca supone «cubierto».

## Informe G-DATOS provisional

**Búsqueda libre por nombre:** no demostrada. **Precio e histórico:** no demostrados. **Cuentas para 20 métricas:** no demostradas. **Noticias, resultados, dividendos, comparables y eventos completos:** no demostrados. **Calendarios oficiales:** acceso a dos páginas demostrado localmente; extracción y comprobación en Worker pendientes. **Cobertura internacional:** no demostrada. No hay proveedor primario aprobado.

Las muestras Apple, Microsoft, Inditex, Santander, ASML, Toyota y empresas nuevas o difíciles siguen pendientes. La sonda usa Apple/AAPL/CIK de Apple solo como valores de prueba configurables, no como lista de empresas permitidas por el producto. Sus resultados no se publican como datos reales ni se usarán para poblar la interfaz.

El siguiente avance útil requiere acceso personal de Cloudflare protegido y credenciales gratuitas de proveedores, o una fuente legal gratuita alternativa para las capacidades faltantes. OpenFIGI ayuda a identificar instrumentos, pero no sustituye una fuente de precio ni garantiza búsqueda por nombre corriente. Sin pruebas de esos bloques no se cerrará F02 ni se afirmará que la app puede cubrir cualquier mercado por 0 €.
