# F02: prueba local de calendarios Fed, BCE y BLS

**Fecha:** 2026-10-02, entorno local, Node 24. **Alcance:** fechas civiles Fed/BCE y fechas/horas locales anunciadas en el calendario BLS. No aporta cotizaciones ni resultados de publicaciones.

## Reproducción y resultado

Desde la raíz del proyecto:

```sh
node --test experiments/provider-spike/calendar-extract.test.mjs experiments/provider-spike/runner.test.mjs
node experiments/provider-spike/cli.mjs --live --max-requests=2 --case=fed-calendar --case=ecb-calendar
node experiments/provider-spike/cli.mjs --live --max-requests=1 --case=bls-calendar
```

Las 13 pruebas sintéticas pasaron. Las sondas hicieron dos GET locales Fed/BCE y un GET BLS, todos HTTP 200. BLS se inspeccionó también con dos solicitudes exploratorias acotadas antes de preparar su extractor. No se guardaron cuerpos HTML/ICS, credenciales ni cabeceras sensibles.

| Fuente oficial | Bytes | Resultado normalizado el 02-10-2026 | Próximas fechas encontradas |
|---|---:|---|---|
| [Fed: calendario FOMC](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) | 167.565 | 56 reuniones con rango de fechas en 2021–2027; 10 futuras. | 27–28 octubre y 8–9 diciembre de 2026. |
| [BCE: reuniones del Consejo](https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html) | 106.266 | 18 fechas futuras del segundo día de reuniones monetarias; excluye reuniones no monetarias. | 29 octubre y 17 diciembre de 2026. |
| [BLS: calendario ICS](https://www.bls.gov/schedule/news_release/bls.ics) | 80.672 | 313 publicaciones; 33 con fecha posterior al 02-10-2026. | Real Earnings y CPI: 14 octubre de 2026, 08:30 `US-Eastern`. |

El extractor [local](../../experiments/provider-spike/calendar-extract.mjs) valida fechas y estructura; si la Fed deja de ofrecer ocho reuniones regulares por año en ese formato o cambia la estructura, falla en vez de aceptar silenciosamente una lista parcial. Un cambio de HTML del BCE también puede romper la extracción y exigirá revisión. Las pruebas sintéticas incluyen meses abreviados y reuniones entre dos meses. La sonda solo devuelve conteos y las dos próximas fechas; no publica el HTML.

**Significado de las fechas Fed/BCE:** son días de calendario, sin hora ni zona horaria. La Fed advierte que cada fecha futura es tentativa hasta confirmarse en la reunión inmediatamente anterior; no se ha comprobado la confirmación de cada cita ni cambios posteriores. Para el BCE se extrae el segundo día anunciado, que la página asocia con la rueda de prensa, no una hora de publicación. Hay que volver a consultar antes de mostrar fechas como vigentes.

**BLS:** devuelve `date`, `localTime`, `sourceTimeZone: US-Eastern` y título; valida `VCALENDAR/VEVENT`, fechas reales, hora y líneas plegadas. No convierte esa hora a UTC ni crea un instante sin verificar la zona y el horario de verano. El resumen excluye el día de la consulta para no llamar «futuro» a un evento que ya ocurrió. El feed está enlazado por la [ayuda oficial de suscripción](https://www.bls.gov/help/hlpiCAL.htm), que explica su actualización; no se ha probado aún detección de cambios ni ejecución en Cloudflare.

## Derechos y decisión

El [aviso de la Fed](https://www.federalreserve.gov/disclaimer.htm) indica que su información es de dominio público salvo indicación contraria y pide citar la fuente. El [aviso del BCE](https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html) permite el uso libre de información obtenida directamente del sitio con reproducción exacta y atribución; contiene condiciones adicionales para contenido modificado y enlaces. Estos avisos respaldan una investigación del uso personal de fechas con atribución, pero no se ha validado una política específica de consultas automatizadas o caché para esta aplicación.

El [aviso del BLS](https://www.bls.gov/bls/linksite.htm) declara dominio público su información salvo material de terceros previamente protegido; este ensayo solo extrae fechas, horas y títulos del feed oficial de suscripción. Faltan atribución en producto, política de caché y refresco y prueba desde Worker.

**Decisión:** prueba local de extracción `PROBADO` para estas fechas; integración en Worker, refresco, detección de cambios, confirmación, atribución visible y aceptación completa de F11 siguen `PENDIENTE`. No hay adaptador activo ni se cierra G-DATOS: faltan precios, búsqueda por nombre y otras capacidades financieras.
