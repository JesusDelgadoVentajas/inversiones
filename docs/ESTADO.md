# Estado del proyecto

**Actualizado:** 2026-10-03 (Europe/Madrid). **Completas en local:** F00, F03 y F04. **Abiertas:** F01, F02 y F05–F08. F09–F20 no iniciadas. [Continuación actual](evidencias/F01_F08_CONTINUACION.md); [base de F02–F08](evidencias/F02_F08.md).

## Qué existe realmente

- Repositorio GitHub [público](https://github.com/JesusDelgadoVentajas/inversiones) conectado como `origin`, todavía sin push del trabajo local. CI preparada, sin ejecución remota comprobada.
- Wrangler autenticado por OAuth en una cuenta. El propietario confirmó Workers Free; facturación, autenticación fuerte y política Access aún pendientes. El OAuth no incluye permiso de Access. Se crearon las D1 privadas `inversiones-staging` e `inversiones-production`, con UUID/bindings distintos, cinco migraciones aplicadas y nueve tablas vacías verificadas en cada una. **F05.01 completa; ningún Worker desplegado.**
- Web React/TypeScript y Worker en el mismo origen, con tipos estrictos. Búsqueda por nombre, selección de mercado/clase/moneda, perfil por UUID y vistas de precio/histórico implementadas y comprobadas con datos **sintéticos**. La pantalla normal permanece en preparación y con búsqueda desactivada.
- Contratos de identidad, bloques, unidades, procedencia, cotización y series; [API](API.md). Cinco migraciones D1 locales probadas desde vacío y desde la versión previa conservando datos. La última impide reasignar identidad de instrumento o mapeo. Identidades verificadas se guardan transaccionalmente si la fuente permite retención; no se aceptan identidades enviadas por el cliente.
- JWT de Access con JWKS, RS256, emisor, audiencia, fechas y correo del propietario. Las rutas nuevas conservan el guard y los flags. Pruebas en Workerd con claves/JWKS sintéticos; **sin sesión Access real probada**.
- Capa común de proveedores: transporte HTTPS aprobado, cuotas D1 atómicas, tres plazas simultáneas, caché condicionada a licencia, bloqueos, reintentos/circuito, cancelación y plazo compartido. El servicio intenta como máximo una alternativa. `approvedProviders` está vacío: no hay adaptador financiero real activo.
- Cálculo [M01](METRICAS.md) separado de red y presentación, exacto mediante enteros decimales y casos independientes. El histórico rechaza mezclas de moneda/feed/ajuste, solapamientos y duplicados. Gráfico de puntos recibidos y tabla exacta; nunca genera una curva si falta cobertura.
- Precio e histórico muestran origen y tiempos por separado. Refresco del precio cada 30 s solo visible y sujeto a cuota; al fallar conserva observación y avisa de antigüedad. Pausa al ocultar, reanuda controladamente y se detiene ante sesión caducada. La UI no calcula si el mercado está abierto por la hora del ordenador.
- F02: [OpenFIGI](evidencias/F02_IDENTIDAD_OPENFIGI.md) respondió pero falló el muestreo de nombres corrientes en primera página; [EODHD demo](evidencias/F02_PRECIOS_Y_CUENTAS.md) dio un histórico Apple sin probar su plan Free general. [Fed/BCE/BLS](evidencias/F02_CALENDARIOS_MACRO.md) permitieron extraer calendarios oficiales localmente. [Otras fuentes](evidencias/F02_FUENTES_ADICIONALES.md) solo revisadas documentalmente. No hay precio intradía aprobado ni búsqueda abierta real demostrada.
- [Stocklake y TGMCharts probadas localmente sin cuenta](evidencias/F02_BUSQUEDA_FUENTES.md). Stocklake respondió para Apple, Microsoft, Inditex y SAP; falló varios alias y cotizaciones locales, y no entregó observación/feed completo de precio. TGMCharts devolvió resúmenes estadounidenses, cuentas Apple con trazabilidad declarada y una serie P/E; candidato auxiliar, sin cobertura global ni tiempo real. El nuevo encargo retomó F01–F08: las sondas ya son reproducibles y vuelven a comprobar esas carencias, sin activar adaptadores.
- SEC probada en local con el correo verificado de la cuenta como contacto privado: submissions Apple y directorio HTTP 200. Buscar «Apple» devuelve seis emisores; se conserva ambigüedad, sin asumir que son el mismo instrumento. Configuración SEC 0600 en `.local/`, excluida de Git; **F01.07 completa como mecanismo local**, claves financieras/secretos remotos pendientes. No hay prueba SEC desde Worker ni cuentas XBRL normalizadas.
- `APP_READY=false`, `ALLOW_LIVE_PROVIDERS=false` y `preview_urls=false` en configuración y artefactos de staging/producción. Sin previews con nombre. Esto conserva la preparación local; no demuestra protección remota por Access.

## Verificación actual

`npm run check`: **101 pruebas pasan**: 21 de sondas, nueve de scripts, 22 de contratos/cálculos, 35 de integración Workerd/D1 y 14 recorridos Chromium (escritorio y 320 px); tipos estrictos, lint, migraciones, configuración, builds y detección de secretos. Comprobado con contacto SEC privado y canario sintético; la CLI detecta secretos en mapas y archivos privados forzados a Git sin imprimir sus valores. [Evidencia actual y límites](evidencias/F01_F08_CONTINUACION.md). La instalación limpia y capturas anteriores siguen en [F02–F08](evidencias/F02_F08.md); no cambiaron dependencias.

No se ha probado desde un teléfono real, ejecutado CI remota, medido CPU en Cloudflare ni aceptado proveedores/licencias. Una simulación de navegador no sustituye esas pruebas.

La búsqueda anterior fue documental, con 20 invocaciones Stocklake y ocho GET TGMCharts y eliminación de cuerpos temporales. Esta continuación añade tres peticiones MCP, dos GET SEC, nueve GET TGM y consultas de esquema D1 remotas; los nuevos cuerpos financieros solo se procesaron en memoria. Se versionan exclusivamente metadatos saneados, sondas y pruebas sintéticas. [Resultados y fallos registrados](evidencias/F01_F08_CONTINUACION.md).

## Puertas y dependencias pendientes

| Fase | Falta material | Efecto |
|---|---|---|
| F01 | Facturación/MFA, Access y cuentas/claves de datos. | Contacto SEC y mecanismo privado local resueltos; F01.04 continúa abierta. Workers Free confirmado no resuelve el resto. |
| F02 / G-DATOS | Fuente de búsqueda abierta y precio reciente, histórico/cuentas/noticias/eventos con derechos, cuotas y muestra internacional, probada en Worker protegido. | Viabilidad completa a 0 € no demostrada. [Cobertura](COBERTURA.md). |
| F05 / G-ACCESO | Access para todos los hostnames/previews, secretos por entorno, despliegue inerte y pruebas autorizada/denegada, móvil y CPU. | D1 remotas completas; no hay URL personal operativa ni publicación de datos. [Despliegue](DESPLIEGUE.md). |
| F06 | Adaptadores y alternativa realmente aprobados; cuotas contractuales reales de la cuenta entre entornos. | Infraestructura solo validada con fixtures; no registrar un candidato por una página de precios. |
| F07 | Adaptador de búsqueda real con IDs estables y retención admitida; emisor/instrumento verificados, marcas/privadas y nombres nuevos internacionales. | El recorrido local está preparado, pero no garantiza encontrar cualquier empresa. |
| F08 | Precio y cierre anterior auténticos, sesión/calendario fiables, histórico y ajustes reales. | Vistas, controles y fórmula locales no proporcionan cotizaciones actuales. |

## Siguiente tarea concreta

**Resolver F01.05/F05.03: Access gratuito para el propietario y todos los accesos al Worker**, con AUD distintos por entorno y configuración privada. El OAuth actual no ofrece permiso Access; hace falta la sesión del panel o un mecanismo delegado adecuado. Después: secretos por entorno, armazón inerte y pruebas reales de acceso/móvil/CPU. [Tarea actual](tareas/tarea-actual.md).

La entrada independiente F02 conserva identidad por nombre, observación de precio, derechos y mercados faltantes; o una cuenta gratuita autorizada. TGMCharts puede evaluarse como auxiliar para cuentas estadounidenses. SEC ya tiene contacto y acceso local, pero queda extracción/mapeo y prueba remota. Las APIs con clave siguen sin credenciales; no se crean cuentas ni se inventan valores. Repetir desde Worker protegido antes de aprobar adaptadores y conectar F07/F08. [Procedimiento de proveedor](../.agents/skills/integrar-proveedor/SKILL.md), [costes](COSTES.md) y [licencias](LICENCIAS.md).

El trabajo independiente de esta continuación queda entregado, incluida D1 comprobada en Cloudflare. G-DATOS/G-ACCESO y las fases globales abiertas no se marcan completas. Los commits siguen locales; no hacer push ni publicar por el mero hecho de haber creado un commit.
