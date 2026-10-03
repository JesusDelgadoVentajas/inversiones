# Access para dos correos — preparación y verificación

**Fecha:** 2026-10-03 (Europe/Madrid). El propietario autorizó dos direcciones exactas para acceder a su aplicación personal. Sus valores y la política preparada se guardan en `.local/two-email-access/`, con carpeta 0700 y archivos privados 0600, fuera de Git.

## Completado en local

- `ACCESS_ALLOWED_EMAILS` sustituye el correo único por un secreto JSON de una o dos direcciones válidas. La API comprueba coincidencia exacta, sin distinguir mayúsculas; no acepta terceros del mismo dominio, alias ni sufijos parecidos.
- Una lista ausente, mal formada, con entradas inválidas/comodines o más de dos direcciones cierra acceso antes de consultar JWKS. No se añade alternativa permisiva basada en la configuración anterior.
- Se conservan firma RS256, emisor, audiencia, fechas, tipo de token y caché de JWKS. Con JWT/JWKS sintéticos, ambos correos alcanzan el estado `APP_NOT_READY` y un tercero recibe 403 `ACCESS_DENIED`.
- El detector de secretos revisa el JSON completo y cada correo por separado, incluidas sus representaciones codificadas. Los tests solo contienen identidades ficticias.
- `npm run check` con Node 24.21.0: **139 pruebas pasan** — 24 sondas, diez scripts, 45 contratos, 42 integración y 18 navegador — además de tipos, lint, migraciones, configuración, builds y secretos. No cambian dependencias.

## Entrada de Cloudflare

La sesión OAuth vuelve a recibir **403** al consultar `/access/apps`. Los scopes disponibles de Wrangler no incluyen administrar aplicaciones/políticas Access. El propietario confirmó que el panel muestra **Set up Zero Trust for this account**: todavía hace falta crear su organización y dominio de autenticación.

El cambio local y el secreto preparado no protegen por sí solos los archivos estáticos. F01.05, F05.03, F05.06 completa y G-ACCESO permanecen abiertas hasta probar la política, secretos y JWT reales. No se activa ningún proveedor financiero ni producción.

## Continuar

1. Completar el alta de Zero Trust en **Free**. La [guía oficial](https://developers.cloudflare.com/cloudflare-one/setup/) indica que puede exigir datos de pago también en Free; confirmar importe cero y no seleccionar un plan de pago.
2. Proteger el Worker completo con **All traffic**, dejando una única política `Allow` con `Include → Emails` y las dos direcciones privadas autorizadas. Las entradas se combinan como alternativas; no usar dominio completo ni conservar otras reglas que amplíen acceso. [Worker](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [políticas](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/).
3. Añadir y habilitar **One-time PIN**, que no se incorpora automáticamente en organizaciones nuevas. Los códigos se introducen únicamente en Cloudflare, no en chat ni Git. [Configuración](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/).
4. Guardar `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` y `ACCESS_ALLOWED_EMAILS` como secretos de staging. Las dos direcciones autorizadas se encuentran en el archivo privado preparado; conservar AUD distinto para producción.
5. Verificar redirección a login sin sesión, ambas identidades autorizadas, tercero rechazado, JWT/audiencia/caducidad, sesión móvil, rutas alternativas y CPU antes de cerrar G-ACCESO.

[Despliegue](../DESPLIEGUE.md), [estado](../ESTADO.md) y [D013](../DECISIONES.md#d013--dos-correos-exactos-en-configuracion-privada).
