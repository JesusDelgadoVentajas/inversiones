# Preparación de F05: Cloudflare y acceso personal

**Estado 2026-10-03:** D1 privadas de staging y producción creadas, cinco migraciones y esquemas/tablas vacías verificados; bindings `DB` reales distintos. [Staging inerte publicado](evidencias/F05_PRIMERA_PUBLICACION.md) y carga confirmada desde el móvil del propietario; producción no publicada. La pantalla de preparación es pública y Access sigue pendiente: el OAuth de Wrangler **no incluye Access**. Las compilaciones y el Worker remoto mantienen `APP_READY=false`, `ALLOW_LIVE_PROVIDERS=false` y las URL de versión desactivadas. Los [previews con nombre](https://developers.cloudflare.com/workers/previews/) no se han configurado. `local-only` se conserva exclusivamente para desarrollo y pruebas.

## Publicación de pruebas realizada

URL: [inversiones-staging.inversiones-jdv.workers.dev](https://inversiones-staging.inversiones-jdv.workers.dev). Publicación manual con Wrangler desde el código `6d2e7a0`; sin push a GitHub ni despliegue automático adicional. La pantalla indica preparación y no permite buscar. La API de datos rechaza la configuración Access ausente.

Desde `app/`, los comandos utilizados fueron:

```sh
npm run check
npm run build:staging
npm run check:secrets
npx wrangler deploy --config dist/inversiones/wrangler.json --dry-run
npx wrangler deploy --config dist/inversiones/wrangler.json
```

`check` termina compilando producción; por eso hay que **recompilar staging** antes de publicar. El script de build valida el destino y binding. Estos comandos no configuran Access ni autorizan activar datos. No reutilizar un artefacto de otro entorno; la primera publicación usa la configuración generada explícita, sin combinarla con `--env`.

## Condiciones previas

1. El propietario comprueba en su cuenta real Workers Free, D1 Free, Access gratuito, recuperación y facturación. Actualizar [COSTES](COSTES.md); no elegir un producto de pago para completar la guía.
2. Crear una política de Access para la **identidad concreta** del propietario. La [protección de todos los Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) con **All traffic** puede configurarse antes de crear este Worker y cubre también Workers futuros y previews. Antes de usarla, comprobar si hay otros Workers de la cuenta a los que afectaría. Si no procede, publicar únicamente el armazón inerte y activar inmediatamente protección a nivel del Worker, que cubre rutas, `workers.dev` y previews; no añadir datos reales hasta probarla. Una política solo por hostname no cubre automáticamente otras rutas del Worker. Evitar `Everyone` o `Bypass`.
3. Comprobar que staging y producción reciben audiencias Access distintas. Obtener de la cuenta `ACCESS_TEAM_DOMAIN`, los AUD reales y el correo permitido; no escribirlos en Git ni en un argumento de shell. Preparar el método seguro local/secretos de Workers.

## Orden técnico y progreso

1. **Hecho:** dos D1 remotas independientes y bindings reales en `env.staging.d1_databases` y `env.production.d1_databases` de `app/wrangler.jsonc`. Crear estas bases privadas con la sesión autorizada no depende de publicar un Worker ni de Access. Revisar límites gratuitos antes de crear recursos. Si se clona para otra cuenta, no recrear ni migrar a ciegas: comprobar titular y sustituir ambos UUID por sus bases reales.
2. **Hecho:** cinco migraciones en local, staging y producción; nueve tablas vacías y claves foráneas comprobadas remotamente. `npm run check` verifica contratos/configuración/build; la instalación limpia ya se había probado. Las siguientes migraciones se ensayarán primero en local y staging antes de producción. Desde `app/`, seleccionar explícitamente `--config wrangler.jsonc` y `--env` al usar Wrangler remoto para evitar un artefacto seleccionado anteriormente por el plugin Vite. Nunca confundir crear una base con repetir una migración de una base existente.
3. Introducir `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` y `ACCESS_OWNER_EMAIL` como [secretos de Worker](https://developers.cloudflare.com/workers/configuration/secrets/) **por entorno** mediante el flujo interactivo. El AUD de staging debe corresponder a su aplicación y el de producción a la suya. No copiar estos valores en `.dev.vars.example`, documentación, registros ni código frontend.
4. **Hecho para staging:** publicar únicamente el armazón inerte, verificar destino/flags y desactivar URL de versión. Falta protegerlo: abrir **Workers & Pages → inversiones-staging → Access**, seleccionar **Protect this Worker behind Access → All traffic** y aplicar una política. Si el diálogo solo ofrece `Cloudflare account` o `Email domain`, elegir la cuenta como protección inicial y después editar su aplicación en **Zero Trust → Access → Applications**: sustituir la regla inicial por una regla `Allow` cuyo `Include → Emails` contenga únicamente el correo del propietario. No conservar otras reglas que amplíen acceso. [Procedimiento oficial](https://developers.cloudflare.com/workers/configuration/cloudflare-access/#protect-one-worker). No habilitar datos con la política provisional. Si hace falta alta de Zero Trust, usar el plan gratuito.
5. **Carga móvil del armazón confirmada.** Después de configurar secretos y Access, probar sesión autorizada y navegador sin sesión, `workers.dev` y cualquier dirección alternativa. Revisar página estática, salud y `/api/v1/capabilities`; la API debe denegar token ausente/ajeno y conservar `APP_READY=false`. Repetir el inicio de sesión en el móvil fuera de la red local. Medir JWT frío/caliente, CPU, errores y cuotas Free; documentar evidencias saneadas. Si falla protección/configuración, no habilitar proveedores.
6. Solo tras G-ACCESO y G-DATOS, añadir secretos de fuentes aprobadas por entorno, límites contractuales y adaptadores; activar datos con un cambio revisado y nuevo despliegue. No basta cambiar una variable en un artefacto antiguo: compilar para el entorno correcto.

**Pendiente actual:** F05.01 y F05.02 para staging están completas. F05.03 y F05.06–F05.09 conservan entradas de Access, costes, secretos y ensayos de autenticación remota. F05.07 tiene controles locales de artefactos/registros y canarios probados; falta repetirlos con secretos/registros remotos reales. El OAuth permite Workers y D1, pero consultar aplicaciones Access devuelve 403; hace falta el panel o permisos delegados adecuados. La carga móvil del armazón y los JWT sintéticos no equivalen a una sesión Access válida. No activar datos ni publicar producción antes de verificar las puertas correspondientes.
