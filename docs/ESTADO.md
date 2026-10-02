# Estado del proyecto

**Actualizado:** 2026-10-02 (Europe/Madrid). **Completas en local:** F00, F03 y F04. **Abiertas:** F01, F02 y F05–F08. F09–F20 no iniciadas. [Última evidencia de F02–F08](evidencias/F02_F08.md); [base F04–F06](evidencias/F04_F06.md).

## Qué existe realmente

- Repositorio GitHub [público](https://github.com/JesusDelgadoVentajas/inversiones) conectado como `origin`, todavía sin push del trabajo local. CI preparada, sin ejecución remota comprobada.
- Wrangler autenticado por OAuth. El propietario confirmó Workers Free; facturación, autenticación fuerte y política Access aún pendientes. El OAuth no incluye permiso de Access. No se han creado ni publicado recursos; no existe D1 remota.
- Web React/TypeScript y Worker en el mismo origen, con tipos estrictos. Búsqueda por nombre, selección de mercado/clase/moneda, perfil por UUID y vistas de precio/histórico implementadas y comprobadas con datos **sintéticos**. La pantalla normal permanece en preparación y con búsqueda desactivada.
- Contratos de identidad, bloques, unidades, procedencia, cotización y series; [API](API.md). Cinco migraciones D1 locales probadas desde vacío y desde la versión previa conservando datos. La última impide reasignar identidad de instrumento o mapeo. Identidades verificadas se guardan transaccionalmente si la fuente permite retención; no se aceptan identidades enviadas por el cliente.
- JWT de Access con JWKS, RS256, emisor, audiencia, fechas y correo del propietario. Las rutas nuevas conservan el guard y los flags. Pruebas en Workerd con claves/JWKS sintéticos; **sin sesión Access real probada**.
- Capa común de proveedores: transporte HTTPS aprobado, cuotas D1 atómicas, tres plazas simultáneas, caché condicionada a licencia, bloqueos, reintentos/circuito, cancelación y plazo compartido. El servicio intenta como máximo una alternativa. `approvedProviders` está vacío: no hay adaptador financiero real activo.
- Cálculo [M01](METRICAS.md) separado de red y presentación, exacto mediante enteros decimales y casos independientes. El histórico rechaza mezclas de moneda/feed/ajuste, solapamientos y duplicados. Gráfico de puntos recibidos y tabla exacta; nunca genera una curva si falta cobertura.
- Precio e histórico muestran origen y tiempos por separado. Refresco del precio cada 30 s solo visible y sujeto a cuota; al fallar conserva observación y avisa de antigüedad. Pausa al ocultar, reanuda controladamente y se detiene ante sesión caducada. La UI no calcula si el mercado está abierto por la hora del ordenador.
- F02: [OpenFIGI](evidencias/F02_IDENTIDAD_OPENFIGI.md) respondió pero falló el muestreo de nombres corrientes en primera página; [EODHD demo](evidencias/F02_PRECIOS_Y_CUENTAS.md) dio un histórico Apple sin probar su plan Free general. [Fed/BCE/BLS](evidencias/F02_CALENDARIOS_MACRO.md) permitieron extraer calendarios oficiales localmente. [Otras fuentes](evidencias/F02_FUENTES_ADICIONALES.md) solo revisadas documentalmente. No hay precio intradía aprobado ni búsqueda abierta real demostrada.
- `APP_READY=false`, `ALLOW_LIVE_PROVIDERS=false` y `preview_urls=false` en configuración y artefactos de staging/producción. Sin previews con nombre. Esto conserva la preparación local; no demuestra protección remota por Access.

## Verificación de esta entrega

`npm run check`: 13 pruebas de sondas, 22 de contratos/cálculos, 35 de integración Workerd/D1 y 14 recorridos Chromium (escritorio y 320 px); tipos estrictos, lint, migraciones, configuración, builds y detección de secretos. Instalación con `npm ci`, tipos y build de staging también en copia limpia. Capturas sintéticas inspeccionadas. [Comandos, alcance y limitaciones](evidencias/F02_F08.md).

No se ha probado desde un teléfono real, ejecutado CI remota, medido CPU en Cloudflare ni aceptado proveedores/licencias. Una simulación de navegador no sustituye esas pruebas.

## Puertas y dependencias pendientes

| Fase | Falta material | Efecto |
|---|---|---|
| F01 | Facturación/MFA, Access y cuentas/claves/contacto de datos. | F01.04 continúa abierta; Workers Free confirmado por el propietario no resuelve el resto. |
| F02 / G-DATOS | Fuente de búsqueda abierta y precio reciente, histórico/cuentas/noticias/eventos con derechos, cuotas y muestra internacional, probada en Worker protegido. | Viabilidad completa a 0 € no demostrada. [Cobertura](COBERTURA.md). |
| F05 / G-ACCESO | Access para todos los hostnames/previews, D1 remotas separadas, secretos, despliegue inerte y pruebas autorizada/denegada, móvil y CPU. | No hay URL personal operativa ni publicación de datos. [Despliegue](DESPLIEGUE.md). |
| F06 | Adaptadores y alternativa realmente aprobados; cuotas contractuales reales de la cuenta entre entornos. | Infraestructura solo validada con fixtures; no registrar un candidato por una página de precios. |
| F07 | Adaptador de búsqueda real con IDs estables y retención admitida; emisor/instrumento verificados, marcas/privadas y nombres nuevos internacionales. | El recorrido local está preparado, pero no garantiza encontrar cualquier empresa. |
| F08 | Precio y cierre anterior auténticos, sesión/calendario fiables, histórico y ajustes reales. | Vistas, controles y fórmula locales no proporcionan cotizaciones actuales. |

## Siguiente tarea concreta

Retomar [la tarea actual](tareas/tarea-actual.md) por una de dos entradas independientes: **Access** con la identidad del propietario y verificación de cuenta, o **derechos y cuenta Free de una fuente de precios**. El OAuth actual no permite configurar Access. Las APIs que requieren claves y SEC carecen de credenciales/contacto válido; no se pueden completar esos ensayos inventando valores o aceptando términos por el titular.

Cuando existan esos datos, ejecutar la sonda con presupuesto explícito, registrar los resultados por mercado y probar desde Worker protegido. Después implementar el primer adaptador con IDs persistentes, unidades y cuotas verificadas; conectar las rutas ya preparadas y comprobar F07/F08 con datos reales. [Procedimiento de proveedor](../.agents/skills/integrar-proveedor/SKILL.md), [costes](COSTES.md) y [licencias](LICENCIAS.md).

El trabajo independiente autorizado hasta F08 queda entregado y comprobado localmente. G-DATOS/G-ACCESO y las fases globales abiertas no se marcan completas. Los commits siguen locales; no hacer push ni publicar por el mero hecho de haber creado un commit.
