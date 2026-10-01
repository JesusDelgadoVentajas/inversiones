# Base local de la aplicación

Lee primero el [README del proyecto](../README.md), el [estado](../docs/ESTADO.md) y las [instrucciones del agente](../AGENTS.md). Esta carpeta contiene la web React y la API del Worker en el mismo origen. Todavía no hay búsqueda, cotizaciones ni proveedores habilitados.

La versión de Node indicada en `.node-version` es 24.21.0. Tras usar un gestor de versiones para seleccionarla, `npm ci` reproduce las dependencias. `npm run dev` inicia web y API locales; `npm run check` ejecuta tipos, lint, pruebas deterministas, comprobaciones de configuración y compilaciones de staging y producción. Ambos artefactos mantienen desactivados los datos reales. Consulta `package.json` para el resto de scripts existentes.

La configuración de `wrangler.jsonc` define solo nombres y variables inertes; aún no hay D1, acceso personal ni despliegue configurados. Los scripts de despliegue se añadirán cuando exista protección y se hayan comprobado los destinos. Ejecutar una compilación no publica nada.

La [sonda de proveedores](../experiments/provider-spike/README.md) se ejecuta por separado y no participa en las pruebas automáticas con red real.
