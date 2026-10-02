# Base local de la aplicación

Lee primero el [README del proyecto](../README.md), el [estado](../docs/ESTADO.md) y las [instrucciones del agente](../AGENTS.md). Esta carpeta contiene la web React y la API del Worker en el mismo origen. Búsqueda, perfil, precio, histórico, cuentas/métricas y noticias están preparados y probados con fixtures sintéticos; ningún proveedor real está habilitado y la pantalla normal sigue en preparación.

La versión de Node indicada en `.node-version` es 24.21.0. Tras seleccionarla con un gestor de versiones:

```sh
npm ci
npx playwright install chromium
npm run dev
```

`npm run dev` inicia web y API locales. La instalación de Chromium se requiere para `test:e2e` y `check`, no para abrir la web. En Linux puede hacer falta `npx playwright install --with-deps chromium`, como configura CI; [instrucciones oficiales](https://playwright.dev/docs/intro).

`npm run check` ejecuta tipos estrictos, lint, pruebas de sondas y scripts, contratos e integración, cinco migraciones D1 en base efímera, configuración, navegador en escritorio/320 px, compilaciones de staging/production y detección de secretos. Ambos artefactos mantienen desactivados los datos reales. `npm run test:e2e` ejecuta solo navegador; necesita el puerto local 4173 libre y arranca/cierra su propio servidor. Sus mocks se inyectan desde las pruebas, sin modo de demostración habilitable en producción. Consulta `package.json` para los scripts existentes y [la evidencia actual](../docs/evidencias/F02_F09_F10.md) para resultados y limitaciones.

`wrangler.jsonc` conserva un D1 **local** identificado como `local-only`; staging y producción tienen bindings `DB` con UUID reales, distintos. Ambas bases privadas remotas tienen las cinco migraciones aplicadas y las nueve tablas de aplicación vacías. Para preparar el estado local de desarrollo, ejecutar `npx wrangler d1 migrations apply DB --local` desde `app/`. Access y despliegue del Worker siguen pendientes. Los scripts de despliegue se añadirán cuando exista protección y se hayan comprobado los destinos. Ejecutar una compilación no publica nada. Los pasos remotos están en [DESPLIEGUE](../docs/DESPLIEGUE.md).

`deployment-config.mjs` comparte las comprobaciones de configuración y build: cada artefacto debe conservar exactamente la base del entorno solicitado; se rechazan IDs duplicados, nombres cruzados y `local-only` remoto. `test:scripts` prueba estos controles y el detector de secretos. Este último revisa archivos versionables y `dist/`, incluidos mapas si existen, buscando patrones y valores privados conocidos del entorno o de `.env`/`.dev.vars` locales. Los diagnósticos no imprimen valores. Es un control acotado: un secreto desconocido sin patrón reconocible no queda certificado por el escaneo.

Los contratos ejecutables están en `shared/contracts/`; los cálculos deterministas en `shared/finance/`, la identidad en `worker/identity/` y las rutas en `worker/routes/`. La interfaz usa componentes y un hook común de bloques para cancelación, cuotas y refresco. [API](../docs/API.md) describe las rutas. `/api/v1/*` rechaza solicitudes cuando Access no está configurado; `APP_READY` y `ALLOW_LIVE_PROVIDERS` permanecen en falso. Registrar una fuente real exige antes aceptar F02/F05 y reutilizar el ejecutor de proveedores con transporte/cuotas/caché; nunca activar una fuente solo para ver la nueva interfaz.

La [sonda de proveedores](../experiments/provider-spike/README.md) se ejecuta por separado y no participa en las pruebas automáticas con red real.


## Contraste primario local

El comprobador opcional no consulta red ni participa en CI:

```sh
node scripts/check-primary-reference.mjs ../.local/f09-f10/reference-cases.json
```

Preparar el archivo privado desde conceptos SEC obtenidos con presupuesto y cálculos independientes. Array de 3–5 casos: symbol, cik de diez dígitos, company/listing del contrato, retrievedAt/asOf, conceptos originales en concepts (body y references de accession/start/end/filed), y al menos cinco resultados esperados en `expected` por ID de métrica. Las identidades temporales no se persisten en producción. Solo se calculan los hechos seleccionados; no representan todo el TTM actual.

Archivo ausente, casos/oráculos insuficientes o discrepancia producen error. Informe con checks, duración Node y tamaño, sin cuerpos ni contacto. Los originales SEC públicos/oráculos están en .local/ con permisos 0600; el clon no los incluye. [Referencias y límites](../docs/evidencias/F02_F09_F10.md).

Normalización específica en `worker/normalization/`; cálculo/saneado deterministas y UI con API. No habilitar fuentes para visualizar fixtures.
