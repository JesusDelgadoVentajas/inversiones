# Sonda acotada de proveedores (F02.01)

Esta herramienta prueba **acceso y forma básica** de respuestas. No certifica licencia, exactitud, cobertura mundial, datos en tiempo real ni funcionamiento en Cloudflare Workers. Lee primero [COBERTURA](../../docs/COBERTURA.md) y [PROVEEDORES](../../docs/PROVEEDORES.md).

Desde la raíz, con Node 24:

```sh
node experiments/provider-spike/cli.mjs
node --test experiments/provider-spike/*.test.mjs
```

La primera orden es un ensayo sin llamadas de red. Para una prueba **local y limitada**:

```sh
node experiments/provider-spike/cli.mjs --live --max-requests=2 --case=fed-calendar --case=ecb-calendar
```

Las sondas Fed/BCE extraen fechas civiles futuras sin hora, zona ni confirmación de cada reunión. `bls-calendar` lee el ICS oficial y conserva fecha, hora local y `US-Eastern`, sin convertir a UTC; excluye el día actual del resumen futuro. Para probarlo, `node experiments/provider-spike/cli.mjs --live --max-requests=1 --case=bls-calendar`. Los resultados y límites están en la [evidencia de calendarios](../../docs/evidencias/F02_CALENDARIOS_MACRO.md). Las pruebas sintéticas de los tres extractores se ejecutan con `node --test experiments/provider-spike/calendar-extract.test.mjs`.

`openfigi-search` no necesita clave y usa una solicitud POST. Comprueba si la primera página contiene una acción ordinaria cuyo nombre incluye el texto buscado; eso todavía no confirma bolsa, clase ni instrumento correcto. [La prueba de Inditex](../../docs/evidencias/F02_IDENTIDAD_OPENFIGI.md) muestra el límite. Para ejecutarla: `node experiments/provider-spike/cli.mjs --live --max-requests=1 --case=openfigi-search --query=Apple`. OpenFIGI limita la búsqueda sin clave a cinco solicitudes por minuto; no ejecutar la sonda repetidamente.

Las sondas `sec-submissions` y `sec-directory` necesitan `SEC_USER_AGENT`; las de Finnhub necesitan `FINNHUB_API_KEY`, y `alpaca-snapshot` requiere `ALPACA_API_KEY` junto con `ALPACA_API_SECRET`. El User-Agent de SEC debe identificar de verdad al responsable. El contacto verificado de la cuenta se conserva solo en `.local/f01-f08-continuation/sec.env` (0600, excluido de Git). Para repetir el directorio desde esta máquina, sin escribir el contacto en un argumento:

```sh
node --env-file=.local/f01-f08-continuation/sec.env experiments/provider-spike/cli.mjs --live --max-requests=1 --case=sec-directory --query=Apple
```

Ese archivo privado no existe al clonar: preparar una configuración con contacto real o proporcionar la variable por un mecanismo privado. El directorio comprueba nombres de emisores y conserva el número de coincidencias; no demuestra identidad mundial de instrumentos ni permite elegir silenciosamente la primera.

## Stocklake y TGMCharts

Son candidatos sin aprobar, ensayados como invitado/REST gratuito, sin cuenta ni tarjeta. Stocklake necesita inicialización MCP antes de sus herramientas; la sonda conserva la sesión solo en memoria y cuenta también esa petición en el presupuesto:

```sh
node experiments/provider-spike/cli.mjs --live --max-requests=2 --case=stocklake-initialize --case=stocklake-name --query=Microsoft
node experiments/provider-spike/cli.mjs --live --max-requests=3 --case=tgm-summary --case=tgm-statements --case=tgm-series --symbol=AAPL --years=2
```

También existen `stocklake-quote`, `stocklake-history` y `stocklake-news`; añadir `stocklake-initialize` en la misma ejecución. `--symbol` identifica el instrumento del ensayo, `--query` el nombre, `--days` admite 1–365 y `--years` 2–20. Una herramienta Stocklake puede devolver HTTP 200 e `isError=false` con un error interno: la sonda lo rechaza. Cotización e histórico por símbolo deben corresponder al solicitado. Los resúmenes señalan ausencia de observación/feed, mezcla de fuentes y ajuste desconocido; no convierten la actualización general en hora de cotización. TGM `pe-ratio` se registra como ratio, nunca como histórico OHLC.

`finnhub-news` usa `--from=AAAA-MM-DD --to=AAAA-MM-DD`, valida fechas civiles y orden, y requiere enlaces HTTPS, medio y fecha dentro de la ventana. Por defecto usa **2026-10-01–2026-10-02**, una ventana fija de ensayo; cambiarla explícitamente para comprobar otra fecha. No se ha hecho una llamada real sin la clave del titular. La sonda Stocklake de noticias solo cuenta atribución/enlaces presentes; no certifica sus artículos.

No colocar claves en comandos, repositorio o resultados compartidos. El modo vivo exige casos explícitos y un máximo de 1–10 solicitudes; aplica pausa, timeout, límite de respuesta y detiene un proveedor tras 401/403/429. El handshake no sustituye la cuota del proveedor: respetar el límite diario documentado y no repetir ensayos sin motivo. Las salidas se reducen a estado, tiempo, tamaño y metadatos definidos; no guardan precios, importes, titulares, cuerpos ni credenciales. La CLI devuelve 2 si una ejecución viva incluye casos fallidos/omitidos; conserva su informe para diagnosticar, sin publicarlo como cobertura aceptada.

Después de cada prueba, registrar por separado proveedor, endpoint, fecha, plan, país, instrumento, feed, divisa, retraso, licencias, límites, costes y resultado en [COBERTURA](../../docs/COBERTURA.md). Una respuesta 200 no basta para marcar una capacidad como cubierta. No utilizar la sonda para rellenar la aplicación.
