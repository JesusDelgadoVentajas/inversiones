# F02: prueba local de calendarios Fed y BCE

**Fecha:** 2026-10-02, entorno local, Node 24. **Alcance:** fechas civiles de reuniones de política monetaria; no horas de decisiones, comunicados, datos de empresas ni cotizaciones.

## Reproducción y resultado

Desde la raíz del proyecto:

```sh
node --test experiments/provider-spike/calendar-extract.test.mjs experiments/provider-spike/runner.test.mjs
node experiments/provider-spike/cli.mjs --live --max-requests=2 --case=fed-calendar --case=ecb-calendar
```

Las 12 pruebas sintéticas pasaron. La sonda viva hizo exactamente dos GET locales (uno por fuente), ambos HTTP 200. No se guardaron cuerpos HTML, credenciales ni cabeceras sensibles.

| Fuente oficial | Bytes | Resultado normalizado el 02-10-2026 | Próximas fechas encontradas |
|---|---:|---|---|
| [Fed: calendario FOMC](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) | 167.565 | 56 reuniones con rango de fechas en 2021–2027; 10 futuras. | 27–28 octubre y 8–9 diciembre de 2026. |
| [BCE: reuniones del Consejo](https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html) | 106.266 | 18 fechas futuras del segundo día de reuniones monetarias; excluye reuniones no monetarias. | 29 octubre y 17 diciembre de 2026. |

El extractor [local](../../experiments/provider-spike/calendar-extract.mjs) valida fechas y estructura; si la Fed deja de ofrecer ocho reuniones regulares por año en ese formato o cambia la estructura, falla en vez de aceptar silenciosamente una lista parcial. Un cambio de HTML del BCE también puede romper la extracción y exigirá revisión. Las pruebas sintéticas incluyen meses abreviados y reuniones entre dos meses. La sonda solo devuelve conteos y las dos próximas fechas; no publica el HTML.

**Significado de las fechas:** son días de calendario, sin hora ni zona horaria. La Fed advierte que cada fecha futura es tentativa hasta confirmarse en la reunión inmediatamente anterior; no se ha comprobado la confirmación de cada cita ni cambios posteriores. Para el BCE se extrae el segundo día anunciado, que la página asocia con la rueda de prensa, no una hora de publicación. Hay que volver a consultar antes de mostrar fechas como vigentes.

## Derechos y decisión

El [aviso de la Fed](https://www.federalreserve.gov/disclaimer.htm) indica que su información es de dominio público salvo indicación contraria y pide citar la fuente. El [aviso del BCE](https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html) permite el uso libre de información obtenida directamente del sitio con reproducción exacta y atribución; contiene condiciones adicionales para contenido modificado y enlaces. Estos avisos respaldan una investigación del uso personal de fechas con atribución, pero no se ha validado una política específica de consultas automatizadas o caché para esta aplicación.

**Decisión:** prueba local de extracción `PROBADO` para estas fechas; integración en Worker, refresco, detección de cambios, confirmación, atribución visible y aceptación completa de F11 siguen `PENDIENTE`. No hay adaptador activo ni se cierra G-DATOS: faltan precios, búsqueda por nombre y otras capacidades financieras.
