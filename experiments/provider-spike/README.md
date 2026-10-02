# Sonda acotada de proveedores (F02.01)

Esta herramienta prueba **acceso y forma básica** de respuestas. No certifica licencia, exactitud, cobertura mundial, datos en tiempo real ni funcionamiento en Cloudflare Workers. Lee primero [COBERTURA](../../docs/COBERTURA.md) y [PROVEEDORES](../../docs/PROVEEDORES.md).

Desde la raíz, con Node 24:

```sh
node experiments/provider-spike/cli.mjs
node --test experiments/provider-spike/runner.test.mjs
```

La primera orden es un ensayo sin llamadas de red. Para una prueba **local y limitada**:

```sh
node experiments/provider-spike/cli.mjs --live --max-requests=2 --case=fed-calendar --case=ecb-calendar
```

Las sondas Fed/BCE extraen fechas civiles futuras sin hora, zona ni confirmación de cada reunión. `bls-calendar` lee el ICS oficial y conserva fecha, hora local y `US-Eastern`, sin convertir a UTC; excluye el día actual del resumen futuro. Para probarlo, `node experiments/provider-spike/cli.mjs --live --max-requests=1 --case=bls-calendar`. Los resultados y límites están en la [evidencia de calendarios](../../docs/evidencias/F02_CALENDARIOS_MACRO.md). Las pruebas sintéticas de los tres extractores se ejecutan con `node --test experiments/provider-spike/calendar-extract.test.mjs`.

`openfigi-search` no necesita clave y usa una solicitud POST. Comprueba si la primera página contiene una acción ordinaria cuyo nombre incluye el texto buscado; eso todavía no confirma bolsa, clase ni instrumento correcto. [La prueba de Inditex](../../docs/evidencias/F02_IDENTIDAD_OPENFIGI.md) muestra el límite. Para ejecutarla: `node experiments/provider-spike/cli.mjs --live --max-requests=1 --case=openfigi-search --query=Apple`. OpenFIGI limita la búsqueda sin clave a cinco solicitudes por minuto; no ejecutar la sonda repetidamente.

Las sondas `sec-submissions`, `finnhub-search`, `finnhub-quote`, `finnhub-financials` y `alpaca-snapshot` necesitan respectivamente `SEC_USER_AGENT`, `FINNHUB_API_KEY` o `ALPACA_API_KEY` junto con `ALPACA_API_SECRET` en el entorno local. El User-Agent de SEC debe identificar de verdad al responsable. No colocar claves en los comandos, el repositorio o resultados compartidos. El modo vivo exige selección explícita y un máximo de 1–10 solicitudes; aplica pausa, timeout, límite de respuesta y detiene un proveedor tras 401/403/429. Las salidas se reducen a estado, tiempo, tamaño y verificación básica; no guardan cuerpos ni credenciales.

Después de cada prueba, registrar por separado proveedor, endpoint, fecha, plan, país, instrumento, feed, divisa, retraso, licencias, límites, costes y resultado en [COBERTURA](../../docs/COBERTURA.md). Una respuesta 200 no basta para marcar una capacidad como cubierta. No utilizar la sonda para rellenar la aplicación.
