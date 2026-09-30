# Evidencia de preparación para desarrollar con IA

**Fecha:** 2026-10-01, sesión del propietario en Europe/Madrid.
**Alcance:** instrucciones, documentación operativa, skills y preparación del commit local.
**Estado:** COMPLETA, revisión documental y estructural.

## Punto de partida

En la inspección inicial solo existía `PLAN_CONSTRUCCION.md`. `git status --short --branch` indicó que la carpeta aún no era un repositorio. No se encontró un `AGENTS.md` aplicable en la ruta de directorios inspeccionada. Se conservó el plan y se consultaron alcance, arquitectura, fases, criterios de datos, métricas y seguimiento.

## Comprobaciones realizadas

| Revisión | Criterio | Resultado |
|---|---|---|
| Estructura y lectura | Entradas claras, enlaces locales y anclas válidos, skills con frontmatter correcto. | APROBADA: 109 enlaces locales y anclas comprobados en 11 documentos Markdown; bloques de código cerrados; dos skills válidas. |
| Coherencia | Alcance autorizado, reglas de calidad, estados reales y siguiente tarea compatibles con el plan. | APROBADA: revisión de F00, matriz existente R01–R15, decisiones, separación entre documentación y producto operativo y siguiente tarea F01.01. |
| Exclusiones Git | Credenciales y artefactos excluidos; plantillas y fixtures versionables. | APROBADA: 14 rutas privadas o generadas ignoradas y 8 rutas de código, documentación o ejemplos conservadas. |
| Contenido preparado | Archivos pertinentes, diff y revisión de contenido. | APROBADA: 12 archivos revisados; `git diff --cached --check` sin errores; sin coincidencias de los patrones de claves privadas y tokens comprobados. |

Las comprobaciones de enlaces se ejecutaron mediante Python estándar, resolviendo cada ruta respecto del documento que la enlaza y contrastando sus anclas. No se probaron los servicios enlazados: la fecha de referencia técnica del plan sigue siendo 2026-09-30.

Las skills se validaron con `quick_validate.py`, incluido en la skill `skill-creator`, obteniendo `Skill is valid!` para ambas. El Python inicial no disponía de PyYAML y la creación de un entorno con `ensurepip` falló; se resolvió ejecutando el validador mediante `uv run --no-project --with PyYAML`, con PyYAML 6.0.3 en un entorno aislado. No se añadieron dependencias ni archivos de entorno al proyecto.

Las exclusiones se comprobaron con `git check-ignore --no-index`, incluyendo `.env`, `.dev.vars`, claves, estado de Wrangler y material privado; sus plantillas de ejemplo, el archivo de bloqueo y los fixtures sintéticos siguen siendo versionables. Las exclusiones no sustituyen la revisión de secretos antes de añadir archivos.

## Revisión por escenarios

Se revisó la documentación para estos recorridos, sin ejecutar una integración real ni simular una aceptación de producto:

- **Otra sesión retoma el proyecto:** la entrada conduce a estado y F01.01, sin repetir F00 o reinicializar Git.
- **El propietario pide rapidez:** se puede acotar el alcance, manteniendo honestidad sobre las comprobaciones omitidas.
- **Un proveedor no tiene credenciales:** se registra la dependencia y solo avanza el trabajo independiente; no se inventa cobertura.
- **Una métrica recibe entradas incompatibles:** se explica la ausencia y queda pendiente su aceptación; no se devuelve un cero ficticio.
- **Un cambio solo afecta al texto:** se revisa documentación y diff, sin exigir tests de una app inexistente ni cargar ambas skills.

## Entrega en Git

Durante esta sesión el propietario inicializó Git en `main`. Se comprobó que existe identidad de autor y que no hay remotos configurados. No se modificaron esos ajustes.

El commit de entrega conserva el plan original, actualizado en su seguimiento, junto con los nuevos documentos y `.gitignore`. Antes de crearlo se revisa el contenido preparado y se exige que `git diff --cached --check` no informe errores. El identificador se obtiene del historial del propio archivo mediante `git log -1 --oneline -- docs/evidencias/PREPARACION_IA.md`, evitando escribir dentro de un commit su propio identificador todavía inexistente. No se realiza push.

## Límites

Una validación estructural de una skill no demuestra su efectividad en una integración futura. La selección automática se comprobará al iniciar una sesión compatible; en un cliente sin descubrimiento puede usarse la ruta de su `SKILL.md`.

La aplicación, los tests de código, los proveedores, Cloudflare, la cobertura y los costes efectivos de cuentas no se han comprobado en esta entrega. Se validarán en las fases correspondientes del plan.
