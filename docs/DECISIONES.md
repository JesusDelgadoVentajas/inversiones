# Registro de decisiones

Este registro conserva decisiones y motivos. El avance operativo se mantiene en [ESTADO.md](ESTADO.md); los requisitos R01–R15 y su relación con pruebas se consultan en el [plan, sección 2](../PLAN_CONSTRUCCION.md#s02) y [sección 15.4](../PLAN_CONSTRUCCION.md#s15). Se conserva esa matriz como fuente única, sin duplicarla aquí.

## D001 — Instrucciones breves y contexto por tarea

- **Fecha:** 2026-10-01.
- **Estado:** ADOPTADA.
- **Decisión:** `AGENTS.md` es la entrada del agente; remite al estado, la tarea y la documentación relevante. El README explica el uso al propietario.
- **Motivo:** permitir continuar en otra sesión y evitar instrucciones contradictorias o la lectura completa del plan en cada edición.
- **Consecuencia:** mantener actualizados los enlaces y una única fuente de cada dato. Las reglas locales adicionales se crean solo cuando sean necesarias.

## D002 — Calidad y modularidad antes que velocidad

- **Fecha:** 2026-10-01.
- **Estado:** ACORDADA CON EL PROPIETARIO.
- **Decisión:** dedicar el tiempo necesario a implementar y comprobar. Escribir el mínimo código claro que satisfaga el encargo, separar responsabilidades y reutilizar reglas comunes sin sobreabstraer.
- **Excepción expresa:** si el propietario pide rapidez, priorizar el alcance esencial e identificar las verificaciones pendientes; no falsear resultados ni omitir restricciones de integridad.
- **Motivo:** reducir errores y coste de mantenimiento. La cantidad de líneas y el tiempo empleado no sustituyen la evidencia de funcionamiento.

## D003 — Restricciones y cobertura iniciales

- **Fecha:** 2026-10-01.
- **Estado:** RESTRICCIONES REGISTRADAS; COBERTURA PENDIENTE DE DEMOSTRACIÓN.
- **Decisión:** servicios a 0 €, uso personal protegido, español y búsqueda abierta por nombre de empresa cotizada. No se fija una lista permitida de empresas.
- **Mercados:** el propietario no ha concretado países prioritarios. Se conserva la muestra de EE. UU., España, otro mercado europeo y un mercado asiático del plan.
- **Motivo:** preservar el producto solicitado. Ninguna capacidad de un proveedor candidato se considera aceptada por estar documentada.
- **Consecuencia:** F02 debe demostrar cobertura, derechos y funcionamiento real; cualquier reducción material de alcance exige una decisión expresa del propietario.

## D004 — Arquitectura de referencia para empezar

- **Fecha:** 2026-10-01.
- **Estado:** ADOPTADA PARA LA CONSTRUCCIÓN; OPERACIÓN PENDIENTE DE VALIDACIÓN.
- **Decisión:** seguir la arquitectura principal del [plan, sección 3](../PLAN_CONSTRUCCION.md#s03): React y TypeScript; web y API en un Worker; D1 y acceso personal mediante Access; código previsto en GitHub.
- **Motivo:** un único origen simplifica sesión, acceso móvil y API. La app consulta bajo demanda y no necesita una IA de pago para funcionar.
- **Consecuencia:** en F00 se pospuso el código hasta preparar el trabajo; F03 generó después el armazón y F04–F06 añadieron pruebas locales. Cuentas, planes y comportamiento remoto de Cloudflare siguen pendientes. La variante GitHub Pages permanece como alternativa documentada.

## D005 — Skills concretas y ejecución principal única

- **Fecha:** 2026-10-01.
- **Estado:** ADOPTADA.
- **Decisión:** crear dos skills del repositorio: integrar proveedores y validar métricas. Se invocan cuando corresponda al encargo; no se cargan de forma indiscriminada.
- **Motivo:** son procedimientos recurrentes que necesitan criterios específicos sobre licencias, cobertura, periodos y fiabilidad.
- **Consecuencia:** no crear un catálogo de roles o un sistema de varios agentes. La delegación requiere petición del propietario y un trabajo independiente que la justifique.

## D006 — Evidencia proporcional y seguimiento único

- **Fecha:** 2026-10-01.
- **Estado:** ADOPTADA.
- **Decisión:** conservar el plan como fuente de requisitos y checklist; `ESTADO.md` resume la situación; `tarea-actual.md` concreta la siguiente unidad de trabajo; las evidencias respaldan los cierres.
- **Motivo:** facilitar continuidad sin duplicar el historial del chat ni multiplicar estados contradictorios.
- **Consecuencia:** crear una ficha propia cuando una tarea tenga suficiente alcance; las correcciones pequeñas pueden documentarse en el estado. Los controles automáticos de código se implementarán en F03, no mediante scripts ficticios ahora.

## D007 — Base local y API cerrada hasta validar acceso y datos

- **Fecha:** 2026-10-02.
- **Estado:** ADOPTADA PARA EL DESARROLLO LOCAL; DESPLIEGUE PENDIENTE.
- **Decisión:** mantener un binding D1 `local-only` para migraciones y pruebas, y bindings remotos vacíos hasta disponer de IDs reales. Las rutas de datos `/api/v1/*` verifican el JWT de Access y rechazan toda configuración incompleta. Los adaptadores usan presupuesto D1, concurrencia y transporte validados con fuentes sintéticas; no se registra ningún proveedor real hasta superar F02.
- **Motivo:** probar las piezas de F04–F06 sin publicar datos ni fingir que Cloudflare, una cuenta gratuita o una licencia ya funcionan.
- **Consecuencia:** las compilaciones de staging/producción siguen inertes; G-DATOS y G-ACCESO permanecen abiertas. La cuenta real fijará audiencias, bases y límites contractuales antes de activar consultas.

## D008 — URL de versión desactivadas hasta verificar Access

- **Fecha:** 2026-10-02.
- **Estado:** ADOPTADA PARA EL ARMAZÓN LOCAL; EFECTO REMOTO PENDIENTE DE DESPLIEGUE.
- **Decisión:** fijar `preview_urls=false` en la configuración raíz, staging y producción, comprobar el valor compilado y no configurar aún el bloque `previews`. Antes de publicar datos, proteger el Worker completo con Access y probar cada ruta efectiva.
- **Motivo:** las [URL de versión](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/) pueden introducir un acceso alternativo; el OAuth actual de Wrangler no tiene permiso de Access para configurar esa protección.
- **Consecuencia:** las URL de versión quedan desactivadas en la configuración local. Los [previews con nombre](https://developers.cloudflare.com/workers/previews/) son un mecanismo distinto y son públicos por defecto; no se crearán sin Access. No se considera F05.03 cerrada por esta medida local.

## D009 — Identidad verificada y vistas locales antes de activar datos

- **Fecha:** 2026-10-02.
- **Estado:** ADOPTADA PARA TRABAJO LOCAL AUTORIZADO; ACEPTACIÓN CON PROVEEDORES PENDIENTE.
- **Decisión:** preparar F07/F08 mientras siguen abiertas G-DATOS/G-ACCESO, mediante pruebas sintéticas inyectadas solo desde los tests. Mantener vacío el registro real y los flags en falso. Separar cálculo exacto, persistencia, orquestación y presentación.
- **Identidad:** guardar transaccionalmente hasta 20 candidatos normalizados y verificados por el adaptador antes de devolver los enlaces, exclusivamente si permite su retención. Seleccionar abre un UUID ya resuelto; el navegador no envía mapeos ni crea identidades. No se fusiona por nombre o símbolo. El adaptador real deberá resolver UUID estables a partir de su fuente y políticas aprobadas.
- **Motivo:** comprobar la experiencia y los errores sin publicar datos ni confiar en una identidad aportada por el cliente. Persistir al buscar permite resolver enlaces directos sin depender de la caché financiera; se adelanta así la persistencia prevista «al seleccionar» en F07.04.
- **Consecuencia:** las pruebas locales no cierran F07/F08. Antes de activar una fuente hay que aprobar licencia/retención, mapeo estable y búsqueda real; si su permiso no admite guardar candidatos, adaptar el flujo manteniendo la verificación en servidor. Para el gráfico básico se usan únicamente puntos recibidos en SVG y una tabla exacta, sin otra dependencia ni interpolación de cotizaciones.

## D010 — D1 privadas antes del despliegue del Worker

- **Fecha:** 2026-10-03.
- **Estado:** ADOPTADA; BASES Y ESQUEMAS COMPROBADOS EN CLOUDFLARE.
- **Decisión:** completar F05.01 con dos bases privadas de la cuenta, separadas y migradas, mientras Access sigue pendiente. Conservar `local-only` en desarrollo y usar los UUID reales por entorno. Centralizar la validación de configuración y artefactos para rechazar IDs compartidos, destinos cruzados, datos activos o previews habilitadas.
- **Motivo:** crear y consultar D1 mediante la sesión autorizada de Wrangler no publica un Worker ni una API accesible por el navegador; puede hacerse sin las entradas de Access que faltan. Workers Free fue confirmado por el propietario y se revisaron los límites D1 antes de crear las bases, sin cambio de plan.
- **Consecuencia:** sustituye el estado de bindings vacíos de D007 una vez conocidos los IDs. No cambia el resto de su protección: flags en falso, registro de proveedores vacío y ninguna publicación. Las cinco migraciones y las nueve tablas vacías se verificaron en ambas bases; esto no cierra G-ACCESO ni demuestra llamadas financieras desde Cloudflare. [Evidencia](evidencias/F01_F08_CONTINUACION.md).

## Añadir una decisión

Usa el siguiente ID disponible y registra fecha, estado, decisión, motivo y consecuencias. Si cambias una decisión anterior, conserva su historia y enlaza la que la sustituye. Documenta decisiones relevantes o desviaciones; no conviertas cada elección rutinaria de implementación en un trámite.
