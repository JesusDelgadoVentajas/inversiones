# Inversiones

Proyecto de aplicación personal para buscar empresas cotizadas por su nombre y consultar precios, cuentas, métricas, noticias, competidores y eventos con fuentes y fechas visibles.

**Estado:** búsqueda por nombre, selección de instrumento, fichas de precio/histórico/cuentas/métricas/noticias preparadas y probados localmente con datos sintéticos; contratos, JWT, motor contable y capa común comprobados. Quince referencias contables SEC verificadas para tres empresas, sin activar proveedores. Las D1 privadas de staging y producción están creadas y migradas en Cloudflare. No hay datos financieros reales en la aplicación, Access activo ni Worker desplegado. El presupuesto objetivo de servicios es 0 € y aún no se ha demostrado para el producto completo.

## Dónde empezar

| Necesito… | Consultar |
|---|---|
| Saber qué funciona y qué falta | [Estado actual](docs/ESTADO.md). |
| Entender el producto y sus fases | [Plan de construcción](PLAN_CONSTRUCCION.md). |
| Retomar el trabajo con una IA | [Instrucciones del proyecto](AGENTS.md) y [tarea actual](docs/tareas/tarea-actual.md). |
| Conocer los criterios de código y pruebas | [Calidad](docs/ia/CALIDAD.md). |
| Saber por qué se tomó una decisión | [Registro de decisiones](docs/DECISIONES.md). |
| Revisar fuentes y huecos de datos | [Cobertura](docs/COBERTURA.md) y [proveedores](docs/PROVEEDORES.md). |
| Revisar cálculos y noticias | [Métricas](docs/METRICAS.md) y [noticias](docs/NOTICIAS.md). |
| Entender contratos, rutas y acceso futuro | [API](docs/API.md) y [despliegue](docs/DESPLIEGUE.md). |
| Preparar una tarea nueva | [Plantilla de tarea](docs/tareas/PLANTILLA.md). |

## Trabajar con Codex

Abre la carpeta raíz `inversiones` como proyecto. Codex descubre `AGENTS.md` al iniciar una sesión y utiliza esas instrucciones; no hace falta repetirlas en cada prompt. Si creas o cambias las instrucciones durante una sesión, inicia una nueva para asegurar su carga. Puedes pedirle que resuma las instrucciones activas si necesitas comprobarlo.

Para continuar:

> Retoma el proyecto desde su estado documentado y completa la siguiente tarea pendiente cuyas dependencias estén satisfechas. Comprueba el resultado y actualiza el seguimiento.

Para un encargo concreto:

> Implementa la tarea FXX.NN y cumple sus criterios de aceptación. Conserva los cambios existentes y deja evidencia de las comprobaciones.

Sustituye `FXX.NN` por una tarea real del plan. Para pedir rapidez, dilo expresamente; se priorizará el recorrido esencial y quedará indicado lo que no se haya verificado.

Una nueva conversación puede recuperar el contexto del repositorio mediante `docs/ESTADO.md`. La conversación anterior no sustituye ese registro.

## Usar otra herramienta de IA

Comprueba si reconoce `AGENTS.md`. Si no lo hace, comienza la sesión con:

> Lee `AGENTS.md` y sigue sus instrucciones para trabajar en este proyecto.

Las instrucciones no pueden otorgar a una herramienta capacidades o permisos que no tenga. La carga automática de skills depende del cliente utilizado.

## Procedimientos reutilizables

Las dos skills del repositorio están en `.agents/skills/`:

- [Integrar proveedor](.agents/skills/integrar-proveedor/SKILL.md): evaluar o integrar una fuente financiera, comprobar sus capacidades y dejar evidencia de sus límites.
- [Validar métrica](.agents/skills/validar-metrica/SKILL.md): implementar o revisar una fórmula y contrastar sus resultados con referencias independientes.

Codex puede seleccionarlas cuando encajen con la tarea. También puedes pedir explícitamente `Usa $integrar-proveedor` o `Usa $validar-metrica`. Si un cliente no descubre skills, puede leer el `SKILL.md` enlazado y seguir el procedimiento dentro de sus capacidades.

## Ejecutar la aplicación

Con Node 24.21.0 (ver `app/.node-version`):

```sh
cd app
npm ci
npx playwright install chromium
npm run dev
```

Abrir la URL local que imprima Vite, también desde un móvil en la misma red si se configura el servidor para escuchar en esa red. Chromium se instala para las pruebas, no se necesita para arrancar la web. Para todas las verificaciones locales: `npm run check`. Los comandos y su alcance están en [app/README.md](app/README.md). La pantalla normal sigue en preparación con búsqueda desactivada; las vistas se ejercitan con datos sintéticos en Playwright. `GET /api/health` y `GET /api/example` no entregan precios reales.

El repositorio [GitHub público](https://github.com/JesusDelgadoVentajas/inversiones) está creado; esta entrega permanece en commits locales. D1 se ha comprobado en local y en ambas bases remotas; Access, sesión real y Worker remoto siguen pendientes. Las sondas son locales; SEC/TGM añaden contrastes contables acotados, sin activar proveedores ni demostrar acceso Cloudflare. Consultar [estado](docs/ESTADO.md) antes de proseguir.

## Mantenimiento de la documentación

El plan define requisitos y aceptación; `ESTADO.md` registra el avance actual; `DECISIONES.md` conserva decisiones y motivos; la tarea actual concreta el trabajo siguiente. Cada dato tiene una ubicación principal: enlaza su origen en vez de copiarlo y crear versiones contradictorias.

Las [comprobaciones de la preparación](docs/evidencias/PREPARACION_IA.md), [las de F01–F03](docs/evidencias/F01_F03.md), [las de F04–F06](docs/evidencias/F04_F06.md), [el avance hasta F08](docs/evidencias/F02_F08.md) y [la continuación con D1 remotas y sondas](docs/evidencias/F01_F08_CONTINUACION.md) y [la continuación F02/F09/F10](docs/evidencias/F02_F09_F10.md) documentan el alcance de las revisiones.

Referencias de la configuración del agente: [AGENTS.md en Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md) y [skills del repositorio](https://learn.chatgpt.com/docs/build-skills). Los nombres de comandos y rutas de descubrimiento deben contrastarse con el cliente instalado si cambia su comportamiento.
