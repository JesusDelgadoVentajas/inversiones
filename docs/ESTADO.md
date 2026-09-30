# Estado del proyecto

**Última actualización:** 2026-10-01, fecha de la sesión en Europe/Madrid.
**Revisión:** preparación inicial de instrucciones y seguimiento; consultar `git log -1 --oneline` para el identificador del commit que contiene esta entrega.
**Última fase cerrada:** F00, COMPLETA; [evidencia documental](evidencias/PREPARACION_IA.md).
**Fase siguiente:** F01, PENDIENTE.
**Próxima tarea de construcción:** [F01.01 — Comprobar el entorno](tareas/tarea-actual.md).

## Qué existe realmente

- Plan de construcción con requisitos R01–R15, fases F00–F20, métricas y pruebas de aceptación.
- Instrucciones del proyecto en [AGENTS.md](../AGENTS.md), incluyendo calidad sobre velocidad, código modular, reutilización y verificaciones proporcionadas.
- [README](../README.md) para continuar con Codex u otra herramienta de IA.
- [Criterios de calidad](ia/CALIDAD.md), [decisiones](DECISIONES.md), [plantilla de tarea](tareas/PLANTILLA.md) y siguiente tarea concreta.
- Skills del repositorio para [integrar proveedores](../.agents/skills/integrar-proveedor/SKILL.md) y [validar métricas](../.agents/skills/validar-metrica/SKILL.md).
- Exclusiones Git para credenciales, estado local y artefactos regenerables.

Esta entrega prepara el trabajo con IA. No se ha generado `app/`, instalado dependencias del producto, probado proveedores con credenciales ni desplegado la aplicación.

## Seguimiento de F00

Las seis tareas de F00 están completas y marcadas en el plan; su evidencia es documental.

| Tarea | Evidencia de cierre |
|---|---|
| F00.01 — Inspeccionar plan, instrucciones, archivos y Git | Inspección inicial y revisión documentadas en la evidencia de preparación. |
| F00.02 — Crear estado real y primera tarea | Este archivo y F01.01 en la ficha de tarea actual. |
| F00.03 — Registrar restricciones | D003 en el registro de decisiones y reglas del proyecto. |
| F00.04 — Conservar muestra internacional | D003; países prioritarios no especificados por el propietario. |
| F00.05 — Adoptar arquitectura de referencia | D004; su operación permanece sin validar. |
| F00.06 — Registro de decisiones y matriz R01–R15 | Registro creado; matriz existente conservada en las secciones 2.1 y 15.4 del plan. |

F01–F20 siguen pendientes. El repositorio local existe en `main`, la identidad de autor está disponible y no hay remotos configurados. El commit de esta preparación solo resuelve parte de F01.02; la tarea permanece abierta hasta completar su remoto.

## Próxima tarea concreta

- **ID:** F01.01.
- **Objetivo:** comprobar Git, Node y npm y documentar compatibilidad de herramientas.
- **Archivos previstos:** este estado y una evidencia breve si hace falta; configuración de versiones solo al disponer de una elección comprobada.
- **Cierre:** versiones reales, compatibilidad verificada y siguiente paso registrado. Ver [ficha completa](tareas/tarea-actual.md).
- **Después:** completar remoto y visibilidad en F01.02/F01.03, cuentas gratuitas y registros; demostrar viabilidad en F02.

## Dependencias externas pendientes

| Condición | Responsable o siguiente acción | Efecto |
|---|---|---|
| Sin remoto GitHub; visibilidad pendiente | Propietario y ejecutor en F01.02/F01.03. | No impide documentación ni comprobar herramientas locales. |
| Cuentas y planes gratuitos sin verificar | Propietario para altas y condiciones; ejecutor para preparar comprobaciones de F01. | Impide declarar lista la infraestructura. |
| Credenciales, licencias y consultas reales pendientes | F01/F02, sin compartir secretos en el chat. | Impide aceptar cobertura y disponibilidad de datos. |

Estas dependencias no bloquean F01.01. No hay que pedirlas todas de nuevo antes de comprobar el entorno.

## Decisiones y límites actuales

- **Cobertura aprobada:** ninguna cobertura de proveedor demostrada; permanece el objetivo abierto e internacional del plan.
- **Presupuesto:** 0 € para servicios; no se han creado ni verificado servicios durante esta entrega.
- **Proveedores activos:** ninguno.
- **Arquitectura:** principal del plan, adoptada como referencia de construcción, sin validación operativa.
- **Preferencia de trabajo:** rigor y comprobaciones antes que rapidez, salvo petición expresa del propietario.

## Validación de esta entrega

109 enlaces y anclas locales comprobados en 11 documentos Markdown; ambas skills válidas con el validador de `skill-creator`; exclusiones Git verificadas; revisión de coherencia realizada. Los 12 archivos de la entrega están revisados y `git diff --cached --check` no informa errores. El alcance y la evidencia están en [PREPARACION_IA.md](evidencias/PREPARACION_IA.md). No hay una suite de aplicación ejecutable todavía.

## Entrega a la siguiente sesión

Leer `AGENTS.md`, este estado y la ficha F01.01. Inspeccionar Git antes de cambiar nada y conservar los commits existentes. Consultar las secciones del plan pertinentes al entorno; no empezar generando pantallas o integraciones antes de sus dependencias.

El permiso de esta sesión abarca crear y revisar estos archivos y hacer su commit local. No se ha solicitado push, creación de cuentas ni despliegue en esta entrega. Aplicar cualquier autorización posterior del propietario cuando continúe el trabajo.
