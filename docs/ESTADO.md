# Estado del proyecto

**Actualizado:** 2026-10-02 (Europe/Madrid). **Fases completas en local:** F00, F03 y F04. **Abiertas:** F01, F02, F05 y F06; F07–F20 aún no iniciadas. [Evidencia F04–F06](evidencias/F04_F06.md).

## Qué existe realmente

- Repositorio GitHub [público](https://github.com/JesusDelgadoVentajas/inversiones) configurado como `origin`, todavía vacío: el trabajo local no se ha publicado.
- Wrangler autenticado mediante OAuth en la cuenta del propietario; consulta de D1 remotas sin bases existentes. El plan efectivo y Zero Trust siguen pendientes de comprobación en el panel; la autenticación fuerte sigue pendiente. No se ha creado ni publicado ningún recurso Cloudflare.
- Web React/TypeScript y Worker en un origen, con pantalla honesta de preparación, salud y ejemplo sintético. No muestra información de inversión real.
- Contratos ejecutables para emisor, instrumento, procedencia, bloques y tipos financieros; [API activa y prevista](API.md). Cuatro migraciones y pruebas D1 locales desde vacío y desde versiones previas, con datos preservados.
- Verificador JWT de Access con JWKS, firma RS256, emisor, audiencia, fechas y correo del propietario. Las rutas `/api/v1/*` fallan de forma cerrada sin configuración. Pruebas sintéticas en Workerd, incluida la ruta real con JWKS simulado; **ninguna sesión Access real probada**.
- Capa de proveedor sin fuentes habilitadas: contratos opcionales, transporte HTTPS con origen aprobado y límites, cuotas D1 atómicas, tres plazas simultáneas por proveedor, caché condicionada a permiso de retención, bloqueos, reintentos y circuito. Las [pruebas](evidencias/F04_F06.md) usan respuestas sintéticas; no demuestran licencia ni cobertura.
- CI sin claves reales y scripts de instalación/comprobación en [README](../README.md) y [app/README](../app/README.md). CI remota pendiente de push.

## Puertas y dependencias pendientes

| Fase | Falta material | Consecuencia |
|---|---|---|
| F01 | Confirmar Workers Free/Access en la cuenta conectada, activar autenticación fuerte y preparar cuentas y claves de datos. | Wrangler está conectado, pero no hay infraestructura personal ni plan Free comprobado. |
| F02 / G-DATOS | Precios, búsqueda, históricos, cuentas, noticias y mercados internacionales con fuentes, cuotas y derechos probados desde Worker protegido. | Ningún proveedor real está aprobado ni activo; la app completa a 0 € sigue sin demostrarse. [Cobertura](COBERTURA.md). |
| F05 / G-ACCESO | D1 remotas reales y separadas, protección de todos los hostnames/previews, secretos, despliegue inerte, móvil y CPU reales. | No hay publicación ni acceso personal verificado. [Preparación](DESPLIEGUE.md). |
| F06 | Alternativa real aprobada y comprobación de cuotas contractuales entre entornos reales; integrar primer adaptador cuando pase F02. | Capa común y partición de cuota probadas solo con datos sintéticos. |

Las dos páginas oficiales Fed/BCE respondieron HTTP 200 en pruebas locales de F02, pero no se extrajeron fechas. No hay D1 remota ni consultas reales a Finnhub, Alpaca o SEC. Los costes y licencias siguen sujetos a comprobación de la cuenta y de cada proveedor: [COSTES](COSTES.md), [LICENCIAS](LICENCIAS.md).

## Próximo paso

[F01.04 — Verificar Cloudflare Free y preparar acceso personal](tareas/tarea-actual.md) sigue siendo la siguiente dependencia externa: confirmar el plan en el panel y activar autenticación fuerte. Después continuar F01.05, probar el Worker inerte y cerrar G-ACCESO antes de habilitar fuentes. En paralelo se puede investigar documentalmente una fuente nueva siguiendo [integrar-proveedor](../.agents/skills/integrar-proveedor/SKILL.md), sin cambiar el estado de cobertura por una página promocional.

No declarar F05/F06 completas hasta superar las pruebas remotas y de licencias. El propietario autorizó avanzar trabajo independiente sin esperarlo; los commits se mantienen locales hasta una instrucción de publicación.
