# Base local de la aplicación

Lee primero el [README del proyecto](../README.md), el [estado](../docs/ESTADO.md) y las [instrucciones del agente](../AGENTS.md). Esta carpeta contiene la web React y la API del Worker en el mismo origen. Todavía no hay búsqueda, cotizaciones ni proveedores habilitados.

La versión de Node indicada en `.node-version` es 24.21.0. Tras usar un gestor de versiones para seleccionarla, `npm ci` reproduce las dependencias. `npm run dev` inicia web y API locales; `npm run check` ejecuta tipos, lint, pruebas deterministas, migraciones D1 locales en base efímera, comprobaciones de configuración y compilaciones de staging y producción. Ambos artefactos mantienen desactivados los datos reales. Consulta `package.json` para el resto de scripts existentes.

`wrangler.jsonc` define un D1 **local** identificado como `local-only`; staging y producción mantienen bindings remotos vacíos hasta crear bases reales. Para preparar el estado local de desarrollo, ejecutar `npx wrangler d1 migrations apply DB --local` desde `app/`. Aún no hay D1 remota, acceso personal ni despliegue configurados. Los scripts de despliegue se añadirán cuando exista protección y se hayan comprobado los destinos. Ejecutar una compilación no publica nada. Los pasos remotos están en [DESPLIEGUE](../docs/DESPLIEGUE.md).

Wrangler avisa durante las compilaciones de que `DB` local no se hereda en staging/production. Esa separación es intencionada: `build.mjs` verifica que el artefacto remoto no incluya el ID `local-only`. Al crear D1 remotas, sustituir las listas vacías por bindings con IDs reales y revisar estas comprobaciones.

Los contratos ejecutables están en `shared/contracts/`; el API y sus rutas activas/previstas se describen en [API](../docs/API.md). Las rutas de datos `/api/v1/*` rechazan solicitudes cuando Access no está configurado. Los módulos de proveedores usan exclusivamente respuestas sintéticas en las pruebas; no hay adaptador real habilitado.

La [sonda de proveedores](../experiments/provider-spike/README.md) se ejecuta por separado y no participa en las pruebas automáticas con red real.
