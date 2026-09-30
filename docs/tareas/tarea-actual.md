# F01.01 — Comprobar el entorno de desarrollo

- **Estado:** PENDIENTE.
- **Responsable:** próxima persona o IA que continúe la construcción.
- **Requisito relacionado:** R15, mantenimiento reproducible.
- **Dependencia:** F00, preparación inicial documentada en [ESTADO.md](../ESTADO.md).

## Objetivo

Comprobar las herramientas instaladas y elegir una versión de Node LTS compatible con la generación prevista, antes de crear `app/`. Registrar evidencia suficiente para que otra sesión sepa qué está disponible.

## Contexto mínimo

- [AGENTS.md](../../AGENTS.md) y [estado actual](../ESTADO.md).
- [Plan, sección 13](../../PLAN_CONSTRUCCION.md#s13) para entorno y comandos previstos.
- [F01](../../PLAN_CONSTRUCCION.md#f01) para dependencias y tareas de cuentas que siguen pendientes.

## Trabajo

1. Inspeccionar Git y conservar el historial, remotos y cambios existentes. No repetir `git init` si el repositorio ya existe.
2. Ejecutar `git --version`, `node --version` y `npm --version`; registrar versiones y disponibilidad.
3. Comprobar en documentación oficial vigente qué Node LTS es compatible con las herramientas que se utilizarán. La mención de Node 24 en el plan tiene fecha de referencia; no sustituye esta comprobación.
4. Si falta una herramienta o hay incompatibilidad, documentar exactamente cuál y el paso necesario. Respetar el gestor de versiones existente; no alterar globalmente el equipo por conveniencia.
5. Registrar resultados saneados en el estado o una evidencia breve. Mantener separadas las tareas de cuentas, visibilidad y remoto.

## Criterios de aceptación

- [ ] Git, Node y npm comprobados, con sus versiones reales.
- [ ] Versión de Node elegida con compatibilidad documentada, o bloqueo explícito que mantenga abierta la tarea.
- [ ] Estado del repositorio y siguiente paso registrados sin perder cambios existentes.
- [ ] F01.01 marcada en el plan solo si cumple todos sus criterios.

## Resultado actual

Pendiente de ejecución. Crear los documentos de trabajo y hacer su commit no verifica Node, npm, cuentas de Cloudflare, proveedores ni capacidad de despliegue.

**Siguiente paso al cerrar:** continuar F01.02, comprobando si falta remoto, y F01.03, visibilidad. No repetir trabajo Git ya realizado. Actualizar esta ficha con la siguiente tarea cuando se retome el proyecto, conservando evidencia del trabajo cerrado.
