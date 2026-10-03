# Primera publicación y prueba móvil — F05

**Fecha:** 2026-10-03 (Europe/Madrid). **Resultado:** armazón inerte publicado en staging y carga confirmada por el propietario desde su móvil. Access y los datos financieros permanecen pendientes; no se cierra G-ACCESO.

## Publicación real

- El propietario autorizó la primera publicación en Cloudflare y la prueba móvil. Se conserva el presupuesto de 0 € y la confirmación previa de Workers Free, sin contratar productos ni cambiar el plan.
- La API de la cuenta confirmó que no existían otros Workers. Se registró el subdominio gratuito `inversiones-jdv.workers.dev`.
- Worker: `inversiones-staging`. Código publicado: commit `6d2e7a0`. Versión Cloudflare: `d8367671-3d24-4bc5-933e-71e70597c989`.
- URL: [inversiones-staging.inversiones-jdv.workers.dev](https://inversiones-staging.inversiones-jdv.workers.dev).
- Se compiló staging después de las comprobaciones y se publicó su configuración generada explícita. La simulación previa y la API remota verificaron el binding de D1 staging, `APP_READY=false`, `ALLOW_LIVE_PROVIDERS=false` y las URL de versión desactivadas. El registro de proveedores sigue vacío.
- Producción no se publicó. No se hizo push a GitHub ni se configuró un segundo mecanismo automático de despliegue.

## Comprobaciones y alcance

| Comprobación | Resultado |
|---|---|
| `npm run check` | 136 pruebas pasan, tipos/lint, migraciones, configuración, navegador, builds y secretos. Repetición con el Node 24.21.0 indicado por el proyecto. |
| API administrativa Cloudflare | Despliegue real registrado, flags en falso, D1 staging y `previews_enabled=false`. |
| Navegador Chromium remoto, 375 px | HTTP 200, «Fase de preparación» y «Conexión disponible», sin errores de página ni desbordamiento horizontal. Captura revisada. |
| Navegador Chromium remoto, 320 px | Sin desbordamiento, campo de búsqueda desactivado y captura revisada. |
| API remota desde Chromium anónimo | Salud HTTP 200 con `liveData=false`/`searchAvailable=false`; capacidades y búsqueda HTTP 503 `ACCESS_NOT_CONFIGURED`, también con token falso. Respuestas sin caché; ejemplo explícitamente sintético, sin precio. |
| URL de versión | HTTP 404, sin aplicación; `previews_enabled=false` confirmado por API. |
| Teléfono real del propietario | Confirmó que carga y se ve bien siguiendo la prueba solicitada desde el móvil con Wi-Fi desactivado. No se registran modelo ni tiempos; no constituye una medición de rendimiento. |
| Datos reales | Ninguna fuente activa; buscador desactivado. Falta Access para probar sesión y JWT reales. |

Los detalles administrativos, diagnósticos y capturas permanecen en `.local/first-publication/`, ignorados por Git. Las comprobaciones locales siguen usando datos sintéticos. No se incluyen credenciales, correo del propietario, AUD ni información financiera de terceros en esta evidencia.

La primera comprobación HTTP con `urllib` recibió **403 / Cloudflare 1010**, por firma del navegador. No se interpreta como protección Access: Chromium anónimo sí accede a la pantalla de preparación. No se reintentó con ese cliente bloqueado.

## Qué puede probarse ahora

Abrir la URL desde cualquier red comprueba que la pantalla se sirve desde Cloudflare y no requiere mantener un servidor local. Se muestra una preparación explícita; todavía no permite consultar empresas ni probar métricas/noticias reales. La confirmación del móvil verifica la carga del armazón, no la aceptación de F09 ni el inicio de sesión.

## Siguiente paso

Configurar [Access a nivel del Worker](https://developers.cloudflare.com/workers/configuration/cloudflare-access/#protect-one-worker) siguiendo [el procedimiento del proyecto](../DESPLIEGUE.md): proteger todo el tráfico de `inversiones-staging` y dejar una política que permita únicamente el correo concreto del propietario. El diálogo inicial ofrece cuenta o dominio; la regla de correo concreto se ajusta en la aplicación de Zero Trust. No usar `Everyone`, un dominio de correo completo ni `Bypass`. Si el panel requiere alta de Zero Trust, elegir la modalidad gratuita antes de continuar.

Después, introducir los secretos Access de staging en el panel o por el mecanismo oficial privado, verificar el JWT y repetir acceso autorizado/anónimo y móvil. El OAuth actual obtiene **403** al consultar aplicaciones Access; esa configuración requiere el panel o permisos delegados adecuados. CPU de autenticación, sesión caducada/ajena y audiencias de producción siguen sin comprobarse remotamente.

[Estado](../ESTADO.md), [procedimiento de despliegue](../DESPLIEGUE.md) y [D012](../DECISIONES.md#d012--primera-publicacion-inerte-en-staging).
