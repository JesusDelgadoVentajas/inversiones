# Estado del proyecto

**Actualizado:** 2026-10-02 (Europe/Madrid). **Fases completas en local:** F00, F03 y F04. **Abiertas:** F01, F02, F05 y F06; F07–F20 aún no iniciadas. [Evidencia F04–F06](evidencias/F04_F06.md).

## Qué existe realmente

- Repositorio GitHub [público](https://github.com/JesusDelgadoVentajas/inversiones) configurado como `origin`, todavía vacío: el trabajo local no se ha publicado.
- Wrangler autenticado mediante OAuth en la cuenta del propietario; consulta de D1 remotas sin bases existentes. El propietario confirmó que Workers figura como Free en el panel. El OAuth permite Workers/D1 pero no incluye permiso de Access; Zero Trust, facturación y autenticación fuerte siguen pendientes. No se ha creado ni publicado ningún recurso Cloudflare.
- Web React/TypeScript y Worker en un origen, con pantalla honesta de preparación, salud y ejemplo sintético. No muestra información de inversión real.
- Contratos ejecutables para emisor, instrumento, procedencia, bloques y tipos financieros; [API activa y prevista](API.md). Cuatro migraciones y pruebas D1 locales desde vacío y desde versiones previas, con datos preservados.
- Verificador JWT de Access con JWKS, firma RS256, emisor, audiencia, fechas y correo del propietario. Las rutas `/api/v1/*` fallan de forma cerrada sin configuración. Pruebas sintéticas en Workerd, incluida la ruta real con JWKS simulado; **ninguna sesión Access real probada**.
- Capa de proveedor sin fuentes habilitadas: contratos opcionales, transporte HTTPS con origen aprobado y límites, cuotas D1 atómicas, tres plazas simultáneas por proveedor, caché condicionada a permiso de retención, bloqueos, reintentos y circuito. Las [pruebas](evidencias/F04_F06.md) usan respuestas sintéticas; no demuestran licencia ni cobertura.
- [Sonda local de OpenFIGI](evidencias/F02_IDENTIDAD_OPENFIGI.md): acceso sin clave comprobado para identificar instrumentos; «Inditex», «Alphabet», «Berkshire Hathaway» y «Santander» no produjeron una acción ordinaria de nombre coincidente en la primera página. [Demo EODHD](evidencias/F02_PRECIOS_Y_CUENTAS.md): histórico diario de Apple obtenido localmente, sin demostrar derechos ni cobertura de su plan Free. [Calendarios Fed/BCE](evidencias/F02_CALENDARIOS_MACRO.md): fechas de reuniones futuras extraídas localmente, sin horas ni verificación en Worker. No hay cotizaciones intradía ni acceso desde Worker.
- `preview_urls=false` en raíz, staging y producción, comprobado en ambas compilaciones; no se configura `previews`. Esto evita URL de versión en la configuración local, pero no sustituye Access ni protege por sí mismo los previews con nombre.
- CI sin claves reales y scripts de instalación/comprobación en [README](../README.md) y [app/README](../app/README.md). CI remota pendiente de push.

## Puertas y dependencias pendientes

| Fase | Falta material | Consecuencia |
|---|---|---|
| F01 | Revisar facturación y Access en la cuenta Free, activar autenticación fuerte y preparar cuentas y claves de datos. | Wrangler está conectado y el propietario confirmó Workers Free; no hay infraestructura personal. |
| F02 / G-DATOS | Precios, búsqueda fiable por nombre, históricos, cuentas, noticias y mercados internacionales con fuentes, cuotas y derechos probados desde Worker protegido. | OpenFIGI sirve parcialmente para identidad y una demo de EODHD devolvió un histórico diario de Apple. Ningún proveedor de precio reciente está aprobado ni activo; la app completa a 0 € sigue sin demostrarse. [Cobertura](COBERTURA.md). |
| F05 / G-ACCESO | D1 remotas reales y separadas, protección de todos los hostnames/previews, secretos, despliegue inerte, móvil y CPU reales. | No hay publicación ni acceso personal verificado. [Preparación](DESPLIEGUE.md). |
| F06 | Alternativa real aprobada y comprobación de cuotas contractuales entre entornos reales; integrar primer adaptador cuando pase F02. | Capa común y partición de cuota probadas solo con datos sintéticos. |

Las dos páginas oficiales Fed/BCE respondieron HTTP 200 y permitieron extraer fechas de reuniones futuras en pruebas locales de F02; la integración y el refresco siguen pendientes. No hay D1 remota ni consultas reales a Finnhub, Alpaca o SEC. Los costes y licencias siguen sujetos a comprobación de la cuenta y de cada proveedor: [COSTES](COSTES.md), [LICENCIAS](LICENCIAS.md).

## Próximo paso

[F01.04 — Verificar Cloudflare Free y preparar acceso personal](tareas/tarea-actual.md) sigue en curso: el propietario confirmó Workers Free; faltan revisión de facturación, Zero Trust/Access y autenticación fuerte. El OAuth de Wrangler no incluye Access, por lo que F05 necesita configuración en el panel u otra credencial adecuada antes de verificar G-ACCESO. El siguiente trabajo de F02 es aclarar la licencia de visualización privada y probar el plan Free real de [EODHD](evidencias/F02_PRECIOS_Y_CUENTAS.md), o encontrar otra fuente de precios recientes gratuita y apta para España, Europa y Japón. Seguir [integrar-proveedor](../.agents/skills/integrar-proveedor/SKILL.md) sin cambiar el estado de cobertura por una página promocional.

No declarar F05/F06 completas hasta superar las pruebas remotas y de licencias. El propietario autorizó avanzar trabajo independiente sin esperarlo; los commits se mantienen locales hasta una instrucción de publicación.
