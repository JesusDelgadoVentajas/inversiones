# Inversiones

Proyecto de aplicación personal para buscar empresas cotizadas por su nombre y consultar precios, cuentas, métricas, noticias, competidores y eventos con fuentes y fechas visibles.

**Estado:** preparación documental del desarrollo. La aplicación, las cuentas de servicios, las pruebas de proveedores y el despliegue siguen pendientes. El presupuesto acordado de servicios es 0 €; la cobertura gratuita se debe demostrar antes de construir la ficha completa.

## Dónde empezar

| Necesito… | Consultar |
|---|---|
| Saber qué funciona y qué falta | [Estado actual](docs/ESTADO.md). |
| Entender el producto y sus fases | [Plan de construcción](PLAN_CONSTRUCCION.md). |
| Retomar el trabajo con una IA | [Instrucciones del proyecto](AGENTS.md) y [tarea actual](docs/tareas/tarea-actual.md). |
| Conocer los criterios de código y pruebas | [Calidad](docs/ia/CALIDAD.md). |
| Saber por qué se tomó una decisión | [Registro de decisiones](docs/DECISIONES.md). |
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

Todavía no existe `app/` ni `package.json`. No hay comandos de instalación o arranque operativos. La generación del proyecto y las comprobaciones automáticas se prepararán en [F03](PLAN_CONSTRUCCION.md#f03), después de las dependencias indicadas en el plan. En esa fase se documentarán aquí los comandos comprobados.

La arquitectura de referencia es React y TypeScript con web y API en un Cloudflare Worker, D1 y acceso personal. Su funcionamiento y coste en la cuenta real permanecen pendientes de validación.

## Mantenimiento de la documentación

El plan define requisitos y aceptación; `ESTADO.md` registra el avance actual; `DECISIONES.md` conserva decisiones y motivos; la tarea actual concreta el trabajo siguiente. Cada dato tiene una ubicación principal: enlaza su origen en vez de copiarlo y crear versiones contradictorias.

Las [comprobaciones de esta preparación](docs/evidencias/PREPARACION_IA.md) documentan el alcance de la revisión inicial.

Referencias de la configuración del agente: [AGENTS.md en Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md) y [skills del repositorio](https://learn.chatgpt.com/docs/build-skills). Los nombres de comandos y rutas de descubrimiento deben contrastarse con el cliente instalado si cambia su comportamiento.
