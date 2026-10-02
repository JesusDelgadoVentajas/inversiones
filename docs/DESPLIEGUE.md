# Preparación de F05: Cloudflare y acceso personal

**Estado 2026-10-02:** procedimiento preparado; **ningún paso remoto se ha ejecutado**. No hay sesión de Cloudflare ni IDs de D1 reales. Las compilaciones de staging y producción mantienen `APP_READY=false`, `ALLOW_LIVE_PROVIDERS=false` y **sin binding remoto D1**. El binding `local-only` de `app/wrangler.jsonc` sirve exclusivamente para desarrollo y pruebas.

## Condiciones previas

1. El propietario comprueba en su cuenta real Workers Free, D1 Free, Access gratuito, recuperación y facturación. Actualizar [COSTES](COSTES.md); no elegir un producto de pago para completar la guía.
2. Crear una política de Access para la **identidad concreta** del propietario. Preferir protección a nivel de Worker, que [cubre rutas, `workers.dev` y previews](https://developers.cloudflare.com/workers/configuration/cloudflare-access/). Comprobar el alcance efectivo en esa cuenta; una política solo por hostname no cubre automáticamente otras rutas del Worker. Evitar `Everyone` o `Bypass`.
3. Comprobar que staging y producción reciben audiencias Access distintas. Obtener de la cuenta `ACCESS_TEAM_DOMAIN`, los AUD reales y el correo permitido; no escribirlos en Git ni en un argumento de shell. Preparar el método seguro local/secretos de Workers.

## Orden técnico pendiente

1. Crear dos D1 remotas independientes con Wrangler, una para staging y otra para producción. Guardar los **IDs reales** en los bindings `env.staging.d1_databases` y `env.production.d1_databases` de `app/wrangler.jsonc`; conservar `DB` como nombre del binding. No copiar `local-only` a un entorno remoto. Revisar el diff antes de continuar.
2. Aplicar `npm ci` y `npm run check` en `app/`. Aplicar migraciones primero a la D1 local (`wrangler d1 migrations apply DB --local`), luego a staging (`--remote --env staging`) y solo después a producción (`--remote --env production`). Consultar los nombres de base que muestre Wrangler antes de responder a cualquier confirmación.
3. Introducir `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` y `ACCESS_OWNER_EMAIL` como [secretos de Worker](https://developers.cloudflare.com/workers/configuration/secrets/) **por entorno** mediante el flujo interactivo. El AUD de staging debe corresponder a su aplicación y el de producción a la suya. No copiar estos valores en `.dev.vars.example`, documentación, registros ni código frontend.
4. Publicar únicamente el armazón inerte después de comprobar destino y protección. Probar desde sesión autorizada y desde un navegador sin sesión, también con `workers.dev`, dominio alternativo y previews existentes. En cada caso revisar página estática, salud y `/api/v1/capabilities`; la API debe denegar token ausente/ajeno y conservar `APP_READY=false`.
5. Probar desde un móvil fuera de la red local. Medir verificación JWT en frío y caliente, CPU, errores y cuotas en el plan Free real. Documentar evidencias saneadas. Si la protección o configuración falla, detener F05 y no habilitar proveedores.
6. Solo tras G-ACCESO y G-DATOS, añadir secretos de fuentes aprobadas por entorno, límites contractuales y adaptadores; activar datos con un cambio revisado y nuevo despliegue. No basta cambiar una variable en un artefacto antiguo: compilar para el entorno correcto.

**Bloqueo actual:** F05.01–F05.03, F05.06, F05.08 y F05.09 requieren cuenta/sesión y ensayos remotos. El módulo JWT, sus pruebas sintéticas y el cierre por configuración ausente están en el repositorio, pero no equivalen a una sesión válida de Cloudflare Access.
