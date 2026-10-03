# Configurar Access para dos correos autorizados

- **Encargo vigente:** restringir la web a los dos correos indicados por el propietario, sin publicarlos en Git ni frontend. Autorización para configurar Access y desplegar el cambio en staging; presupuesto 0 € y fuentes desactivadas.
- **Trabajo independiente completado:** guard de API para lista privada JSON de una o dos direcciones exactas, sin comodines/alias; pruebas de ambos correos, terceros y listas inválidas. 139 comprobaciones de comportamiento pasan en la suite local. Lista y política concreta preparadas en `.local/two-email-access/`, privada e ignorada. [Evidencia](../evidencias/F05_DOS_CORREOS.md).
- **Entrada externa pendiente:** el propietario confirmó que el panel pide **Set up Zero Trust**. Guiar el alta en Free, luego proteger `inversiones-staging` con **All traffic**, una única regla `Allow → Include → Emails` para esos dos correos y método One-time PIN. El OAuth no tiene permiso Access y la API devuelve 403.
- **Siguiente comprobación:** completar política/secretos de staging, probar inicio de sesión de ambas direcciones y rechazo anónimo/terceros, sesión móvil y CPU. Conservar flags en falso hasta superar G-ACCESO/G-DATOS. El código de la lista no protege por sí solo los archivos estáticos.

## Primera publicación de staging y prueba móvil

- **Encargo anterior:** publicar por primera vez en Cloudflare y probar desde el móvil del propietario. Armazón publicado; no se habilitaron fuentes financieras ni contrataron servicios.
- **Resultado entregado:** staging inerte desplegado desde `6d2e7a0`; configuración remota comprobada y carga confirmada por el propietario desde su teléfono. La pantalla de preparación es pública; Access y producción pendientes. [Evidencia](../evidencias/F05_PRIMERA_PUBLICACION.md).
- **Comprobaciones:** 136 pruebas locales pasan con Node 24.21.0; Chromium remoto a 375/320 px, API sin datos, rechazo seguro por Access ausente y URL de versión desactivada. La confirmación móvil acredita la carga, no el inicio de sesión ni métricas/noticias.
- **Pendiente conservado:** configurar Access para `inversiones-staging`; la nueva petición concreta dos correos autorizados. Introducir secretos Access de staging de forma privada y probar JWT, acceso anónimo/ajeno/caducado y sesión móvil. Mantener ambos flags en falso hasta superar G-ACCESO y G-DATOS.

## Trabajo anterior F02, F09 y F10

- **Encargo anterior:** validar cuentas SEC/XBRL, contrastar TGMCharts y ampliar las pruebas de fuentes; desarrollar todo lo independiente posible de F09 y F10. Trabajo entregado en commit local; se conservan sus entradas externas.
- **Punto de partida:** [Stocklake/TGMCharts ensayadas](../evidencias/F02_BUSQUEDA_FUENTES.md), sin fuente principal aprobada. Armazón local F03/F04 y partes de F05–F08 comprobados con datos sintéticos. No publicar la web ni activar proveedores sin satisfacer las puertas correspondientes.
- **Resultado entregado:** normalización local, revisiones/trimestres/TTM, catálogo M01–M32, API/vistas de cuentas/métricas/noticias y saneado/paginación y publicaciones regulatorias SEC. 136 pruebas locales y 15 referencias primarias pasan; 24 cifras TGM contrastadas con SEC. [Evidencia actual](../evidencias/F02_F09_F10.md). D1 y resultados anteriores se conservan en [su evidencia](../evidencias/F01_F08_CONTINUACION.md).
- **Bloqueos conservados:** Access/MFA/facturación, claves de otras fuentes, sesión/métricas en móvil, CPU y aprobación internacional de datos. La carga del armazón móvil ya está confirmada. Contacto y normalización SEC US GAAP acotada resueltos en local; no acreditan adaptador aprobado ni acceso/CPU financiero desde Worker. No se inventan credenciales ni se crean cuentas de datos por el titular.
- **Siguiente trabajo concreto:** resolver Access; probar SEC por conceptos desde Worker protegido con JWT/CPU y aprobar política del adaptador. En paralelo, cerrar precio/noticias y derechos. Sin entrada nueva o duda concreta, no repetir ensayos ni inventar permisos.

## Pendientes del encargo anterior F02–F08

- **Estado anterior:** trabajo independiente local hasta F08 entregado; aceptación externa pendiente. [Evidencia](../evidencias/F02_F08.md).
- **Alcance conservado:** avanzar dentro de F01–F08 por el nuevo encargo, sin habilitar datos ni reducir alcance para cerrar fases.
- **Resultado local de aquel encargo:** API, identidad, UI, precio/histórico y M01 preparados con fixtures sintéticos, sin proveedor real registrado. El despliegue posterior del armazón se registra al principio de esta tarea.

## Entrada A: F01.04/F01.05 y F05 — Cloudflare personal

1. Conservar Wrangler OAuth existente. Workers Free fue confirmado por el propietario el 02-10-2026; la lectura de suscripciones no está disponible con el OAuth actual. Revisar facturación y cuotas, activar autenticación fuerte y guardar recuperación fuera del repo.
2. Configurar Zero Trust/Access gratuito para la identidad del propietario. El OAuth no tiene permiso Access; hace falta configuración del panel o una credencial adecuada. No compartir contraseñas/tokens por chat o Git.
3. Proteger el Worker staging completo y sus alternativas antes de publicar datos. D1 y primer armazón remoto están completos; conservar `APP_READY=false` y fuentes desactivadas. [Procedimiento](../DESPLIEGUE.md).
4. Verificar sesión válida/caducada, usuario ajeno, ruta alternativa, JWT real, sesión móvil y CPU. La primera publicación de staging está autorizada y realizada; no se infiere autorización para otras publicaciones o push de un commit. Cerrar G-ACCESO solo con resultados reales.

F01.04 conserva pendiente confirmar la modalidad efectiva y ausencia de facturación con evidencia de la cuenta. Los límites y el responsable constan en [COSTES](../COSTES.md); marcar el plan al satisfacer aceptación. No se considera cerrada por la confirmación del propietario de Workers Free.

## Entrada B: F02 — Fuente gratuita de búsqueda y precios

1. Revisar derechos de display exclusivamente personal, conservación y corte de gasto del plan real. La [búsqueda posterior](../evidencias/F02_BUSQUEDA_FUENTES.md) aporta pruebas locales de Stocklake/TGMCharts, con carencias que impiden aprobar una fuente principal. EODHD Free sigue candidato; Marketstack Free también puede ensayarse para EOD. [Revisión adicional](../evidencias/F02_FUENTES_ADICIONALES.md). Twelve Basic non-display no acredita uso en el panel.
2. Con la cuenta y claves privadas disponibles, ejecutar [la sonda](../../experiments/provider-spike/README.md) con límite explícito. SEC ya tiene contacto verdadero privado; submissions/directorio están probados en local. Las fuentes sin clave tienen sondas repetibles y límites conocidos; ya hay normalización por conceptos y 15 referencias; continuar solo para una duda concreta. No dar de alta ni aceptar términos en nombre del propietario.
3. Registrar búsqueda por nombres nuevos, instrumento/MIC/clase, unidad/divisa, feed y timestamp; histórico/ajuste, límites y derechos por mercado. Muestreo completo según F02: EE. UU., España, otro mercado europeo y Asia. El resultado Apple demo no es cobertura general.
4. Repetir la prueba acotada desde Worker ya protegido. Completar [COBERTURA](../COBERTURA.md), [PROVEEDORES](../PROVEEDORES.md), [LICENCIAS](../LICENCIAS.md) y [COSTES](../COSTES.md), siguiendo [integrar-proveedor](../../.agents/skills/integrar-proveedor/SKILL.md).

## Integración F06–F08 al superar las puertas

1. Implementar adaptador aprobado usando ejecutor, transporte, caché y cuotas existentes; confirmar la cuota conjunta entre entornos. Preparar fixtures sintéticos de su formato externo, no cuerpos restringidos.
2. Resolver IDs internos estables mediante mapeos verificados de la fuente; conservar emisor, clase/ADR, MIC y moneda, sin fusionar por nombre. La búsqueda actual espera UUID persistentes y permiso de retener candidatos. [D009](../DECISIONES.md#d009--identidad-verificada-y-vistas-locales-antes-de-activar-datos).
3. Normalizar cotización y cierre anterior por acciones actuales, con feed, sesión y observación auténticos. Verificar calendario bursátil y ajustes; si no se conocen, mantener ausencia/estado desconocido. [M01](../METRICAS.md).
4. Registrar únicamente capacidades realmente probadas. No cambiar flags ni registrar fuentes mientras falte aceptación de acceso/datos. Las rutas y UI ya preparadas se describen en [API](../API.md).
5. Probar nombre nuevo real → selección → precio/histórico real, enlaces directos, cierres/festivos/suspensión/split y dato antiguo. Ejecutar comprobaciones pertinentes y `npm run check`; actualizar estado y checklist sin confundir local, Worker y aceptación del propietario.

## Condiciones de cierre

- [ ] G-ACCESO probado en la cuenta y hostnames reales, incluido móvil.
- [ ] G-DATOS aprobado para el alcance exigido, con derechos y coste 0 € demostrados.
- [ ] Primer adaptador y búsqueda abierta reales, IDs estables y cuotas verificadas.
- [ ] Cotización/histórico/ajustes reales y pruebas de F07/F08 completas.

Si falta una entrada, avanzar por la otra dentro del encargo vigente. El trabajo local sintético no sustituye ninguna condición externa. [Estado integral](../ESTADO.md).
