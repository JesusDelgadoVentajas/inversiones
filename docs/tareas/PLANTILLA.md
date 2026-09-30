# Plantilla de tarea

Usar para una tarea con suficiente alcance o incertidumbre. Para correcciones pequeñas basta actualizar [el estado](../ESTADO.md). Esta plantilla no es una tarea pendiente ni evidencia de ejecución.

## Identificación

- **ID:** identificador del plan, o identificador local si es trabajo adicional solicitado.
- **Título:** resultado concreto.
- **Estado:** PENDIENTE, EN CURSO, BLOQUEADA, EN REVISIÓN, COMPLETA o NO APLICA justificado.
- **Responsable:** persona o agente ejecutor.
- **Requisitos relacionados:** IDs del plan y enlace a su definición.
- **Dependencias:** tareas, decisiones o recursos necesarios.

## Objetivo y alcance

Describir el comportamiento esperado, los límites del encargo y el problema que resuelve. Si procede, indicar qué trabajo posterior depende de esta tarea.

## Contexto mínimo

Enlazar las secciones del plan, decisiones, módulos y skill pertinentes. No copiar documentos completos ni enumerar lecturas que no cambien la implementación.

## Criterios de aceptación

- [ ] Resultado observable, con entrada y salida esperada cuando corresponda.
- [ ] Tratamiento definido de los fallos relevantes.
- [ ] Comprobaciones necesarias ejecutadas o limitaciones registradas sin cerrar una aceptación pendiente.
- [ ] Seguimiento y documentación pertinente actualizados.

Reemplazar estos ejemplos por criterios de la tarea real. Para una fórmula, definir resultados independientes de la implementación; para un proveedor, distinguir simulación, consulta local y consulta desde Cloudflare.

## Implementación prevista

Describir el cambio suficiente, qué se reutiliza y qué archivos se prevé tocar. Adaptar tras inspeccionar el proyecto; no inventar nombres de scripts o módulos existentes.

## Comprobaciones y resultado

| Comando o comprobación | Entorno y datos | Resultado y evidencia | Limitaciones |
|---|---|---|---|
| Completar al ejecutar. | Indicar local, simulado o servicio real. | Indicar éxito, fallo u omisión. | Explicar efecto sobre la aceptación. |

## Entrega

- **Resultado real:** qué funciona y cómo se verificó.
- **Archivos modificados:** lista o referencia al diff.
- **Bloqueos o pendientes:** condición, responsable y siguiente acción.
- **Siguiente tarea:** ID y objetivo; reflejarla también en `docs/ESTADO.md`.
- **Revisión Git:** commit o referencia obtenida de Git cuando exista; no inventar un identificador.
