# Estado del proyecto

**Actualizado:** 2026-10-01 (Europe/Madrid). **Última fase cerrada:** F03, armazón local reproducible. **Fases abiertas:** F01 (cuentas y protección) y F02 (datos y licencias). [Evidencia](evidencias/F01_F03.md).

## Qué funciona

- Repositorio GitHub [público](https://github.com/JesusDelgadoVentajas/inversiones) creado y configurado como `origin`. Sigue vacío: el commit local no se ha publicado.
- Node 24.21.0 LTS instalado solo dentro de `.local/` y fijado en `app/.node-version`; Git, npm y bloqueo de dependencias comprobados.
- Aplicación React/TypeScript y Worker en el mismo origen, con página inicial en español, `GET /api/health`, respuesta sintética en `GET /api/example` y 404 JSON en API.
- Scripts de tipos, lint, pruebas, configuración, secretos y compilación staging/production. CI de GitHub Actions preparada sin claves; pendiente de ejecución remota porque no hay push.
- Sonda limitada de proveedores y matriz de cobertura. Fed y BCE respondieron HTTP 200 en el equipo local y pasaron una comprobación básica de HTML. No se extrajeron fechas.

Para iniciar la app y repetir las comprobaciones, consultar el [README](../README.md) y el [README de app](../app/README.md). F03 está cerrada como **armazón local**, sin equivaler a una aplicación de inversión operativa ni a un despliegue.

## Qué falta para avanzar

| Trabajo | Situación | Dependencia |
|---|---|---|
| F01.04–F01.05: Cloudflare Workers Free y Access | No hay sesión de Cloudflare disponible ni cuenta comprobada. | Propietario: iniciar sesión y configurar acceso personal; después se puede probar el Worker remoto. |
| F01.06–F01.07, F01.09: proveedores y seguridad | Claves de datos ausentes; exclusiones Git y ejemplos preparados. No se ha verificado autenticación fuerte. | Propietario: abrir cuentas gratuitas necesarias, guardar secretos localmente y comprobar recuperación. Nunca enviar claves por chat ni a Git. |
| F02.02–F02.12: viabilidad de datos | G-DATOS pendiente. Solo se comprobó acceso local a dos páginas de calendario. | Worker protegido y/o claves, pruebas reales de cobertura, cuotas y licencias. |
| F04–F20 | Pendientes. | Seguir el [plan](../PLAN_CONSTRUCCION.md) al resolverse G-DATOS. |

La [matriz de cobertura](COBERTURA.md), [proveedores](PROVEEDORES.md), [licencias](LICENCIAS.md) y [costes](COSTES.md) registran lo documentado y lo no demostrado. No hay precios, noticias, cuentas, competidores ni fechas financieras reales en la interfaz. No hay D1 ni despliegue.

## Próxima tarea concreta

[F01.04 — Verificar Cloudflare Free y preparar acceso personal](tareas/tarea-actual.md). Mientras no haya acceso a la cuenta, se puede ampliar la investigación documental de fuentes, pero no marcar F02 como viable. El propietario pidió avanzar F01, F02 y F03 cuanto fuera posible sin esperarle y terminar con commit local.

## Criterio de seguimiento

Marcar una tarea solo si todos sus criterios están demostrados. Conservar muestras y limitaciones en `docs/evidencias/`; no sustituir datos reales por valores inventados. F00 permanece documentada en [su evidencia](evidencias/PREPARACION_IA.md).
