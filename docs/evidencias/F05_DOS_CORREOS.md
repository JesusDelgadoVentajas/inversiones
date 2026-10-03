# Access para dos correos — preparación y verificación

**Fecha:** 2026-10-03 (Europe/Madrid). El propietario autorizó dos direcciones exactas para acceder a su aplicación personal. Sus valores y la política preparada se guardan en `.local/two-email-access/`, con carpeta 0700 y archivos privados 0600, fuera de Git.

## Completado en local

- `ACCESS_ALLOWED_EMAILS` sustituye el correo único por un secreto JSON de una o dos direcciones válidas. La API comprueba coincidencia exacta, sin distinguir mayúsculas; no acepta terceros del mismo dominio, alias ni sufijos parecidos.
- Una lista ausente, mal formada, con entradas inválidas/comodines o más de dos direcciones cierra acceso antes de consultar JWKS. No se añade alternativa permisiva basada en la configuración anterior.
- Se conservan firma RS256, emisor, audiencia, fechas, tipo de token y caché de JWKS. Con JWT/JWKS sintéticos, ambos correos alcanzan el estado `APP_NOT_READY` y un tercero recibe 403 `ACCESS_DENIED`.
- El detector de secretos revisa el JSON completo y cada correo por separado, incluidas sus representaciones codificadas. Los tests solo contienen identidades ficticias.
- `npm run check` con Node 24.21.0: **139 pruebas pasan** — 24 sondas, diez scripts, 45 contratos, 42 integración y 18 navegador — además de tipos, lint, migraciones, configuración, builds y secretos. No cambian dependencias.

## Despliegue de la preparación en staging

- Código `6ff72ff`, versión Cloudflare `ef8d557e-c689-4ce8-8b18-c1386105ec02`, desplegado mediante Wrangler después de las 139 pruebas, la compilación explícita de staging y la revisión de secretos. Producción y GitHub no se publicaron.
- `ACCESS_ALLOWED_EMAILS` se envió como secreto de staging mediante `deploy --secrets-file` desde el archivo privado 0600. `wrangler secret list --config wrangler.jsonc --env staging` confirmó su nombre, sin revelar su valor. `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD` todavía no están configurados.
- Chromium sin sesión comprobó la pantalla de preparación y `/api/v1/health` con HTTP 200, sin redirección a login. `/api/v1/capabilities` devolvió HTTP 503 `ACCESS_NOT_CONFIGURED`. Los flags remotos conservan `APP_READY=false` y `ALLOW_LIVE_PROVIDERS=false`.

## Entrada de Cloudflare

La sesión OAuth recibió **403** al consultar `/access/apps`; los scopes disponibles de Wrangler no incluyen administrar aplicaciones/políticas Access. El propietario completó el alta de Zero Trust en **Free**, introdujo los datos de pago que exigía el panel y confirmó importe **0 €**, sin cobro. Esta es una confirmación del propietario, no una lectura independiente de facturación. No se cambió ningún plan ni se contrató un producto de pago durante el despliegue.

Después del alta, el propietario indicó que la pestaña Access mostraba **This Worker is not protected by Access / Not protected yet**. Tras recargar pudo pulsar el botón y seleccionar **All traffic**; el diálogo ofrece **Cloudflare account** o **Email domain**. Se le ha indicado usar la cuenta como protección provisional y después sustituir la política por las dos direcciones exactas. Guardado de la política y sesión real todavía sin confirmar.

El guard y el secreto desplegados no protegen por sí solos los archivos estáticos. F01.05, F05.03, F05.06 completa y G-ACCESO permanecen abiertas hasta probar la política, secretos y JWT reales. No se activa ningún proveedor financiero ni producción.

## Continuar

1. **Alta Free completada según el propietario, con importe cero.** Conservar ese plan; la [guía oficial](https://developers.cloudflare.com/cloudflare-one/setup/) contempla datos de pago también en Free.
2. Proteger el Worker completo con **All traffic**, dejando una única política `Allow` con `Include → Emails` y las dos direcciones privadas autorizadas. Las entradas se combinan como alternativas; no usar dominio completo ni conservar otras reglas que amplíen acceso. [Worker](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [políticas](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/).
3. Añadir y habilitar **One-time PIN**, que no se incorpora automáticamente en organizaciones nuevas. Los códigos se introducen únicamente en Cloudflare, no en chat ni Git. [Configuración](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/).
4. Guardar los pendientes `ACCESS_TEAM_DOMAIN` y `ACCESS_AUD` como secretos de staging; `ACCESS_ALLOWED_EMAILS` ya está instalado. Las dos direcciones autorizadas se encuentran en el archivo privado preparado; conservar AUD distinto para producción.
5. Verificar redirección a login sin sesión, ambas identidades autorizadas, tercero rechazado, JWT/audiencia/caducidad, sesión móvil, rutas alternativas y CPU antes de cerrar G-ACCESO.

[Despliegue](../DESPLIEGUE.md), [estado](../ESTADO.md) y [D013](../DECISIONES.md#d013--dos-correos-exactos-en-configuracion-privada).
