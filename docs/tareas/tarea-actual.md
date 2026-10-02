# Continuación autónoma F02, F09 y F10

- **Encargo vigente:** validar cuentas SEC/XBRL, contrastar TGMCharts y ampliar las pruebas de fuentes; desarrollar todo lo independiente posible de F09 y F10. Verificar código/cifras/noticias, actualizar seguimiento y commit local. Se conserva el trabajo anterior de F01–F08 y sus entradas externas.
- **Punto de partida:** [Stocklake/TGMCharts ensayadas](../evidencias/F02_BUSQUEDA_FUENTES.md), sin fuente principal aprobada. Armazón local F03/F04 y partes de F05–F08 comprobados con datos sintéticos. No publicar la web ni activar proveedores sin satisfacer las puertas correspondientes.
- **Resultado entregado:** normalización local, revisiones/trimestres/TTM, catálogo M01–M32, API/vistas de cuentas/métricas/noticias y saneado/paginación y publicaciones regulatorias SEC. 136 pruebas locales y 15 referencias primarias pasan; 24 cifras TGM contrastadas con SEC. [Evidencia actual](../evidencias/F02_F09_F10.md). D1 y resultados anteriores se conservan en [su evidencia](../evidencias/F01_F08_CONTINUACION.md).
- **Bloqueos conservados:** Access/MFA/facturación, claves de otras fuentes, prueba de móvil/CPU y aprobación internacional de datos. Contacto y normalización SEC US GAAP acotada resueltos en local; no acreditan adaptador aprobado ni acceso/CPU desde Worker. No se inventan credenciales ni se crean cuentas de datos por el titular.
- **Siguiente trabajo concreto:** resolver Access; probar SEC por conceptos desde Worker protegido con JWT/CPU y aprobar política del adaptador. En paralelo, cerrar precio/noticias y derechos. Sin entrada nueva o duda concreta, no repetir ensayos ni inventar permisos.

## Pendientes del encargo anterior F02–F08

- **Estado anterior:** trabajo independiente local hasta F08 entregado; aceptación externa pendiente. [Evidencia](../evidencias/F02_F08.md).
- **Alcance conservado:** avanzar dentro de F01–F08 por el nuevo encargo, sin habilitar datos ni reducir alcance para cerrar fases.
- **Resultado local:** API, identidad, UI, precio/histórico y M01 preparados con fixtures sintéticos; no hay proveedor real registrado ni despliegue.

## Entrada A: F01.04/F01.05 y F05 — Cloudflare personal

1. Conservar Wrangler OAuth existente. Workers Free fue confirmado por el propietario el 02-10-2026; la lectura de suscripciones no está disponible con el OAuth actual. Revisar facturación y cuotas, activar autenticación fuerte y guardar recuperación fuera del repo.
2. Configurar Zero Trust/Access gratuito para la identidad del propietario. El OAuth no tiene permiso Access; hace falta configuración del panel o una credencial adecuada. No compartir contraseñas/tokens por chat o Git.
3. Preparar protección del hostname completo y alternativas antes de publicar datos. D1 separadas, bindings reales y cinco migraciones ya están completos; conservar `APP_READY=false` y fuentes desactivadas para el primer armazón remoto. [Procedimiento](../DESPLIEGUE.md).
4. Verificar sesión válida/caducada, usuario ajeno, ruta alternativa, JWT real, móvil y CPU. El despliegue/push requiere autorización vigente; no se infiere de un commit. Cerrar G-ACCESO solo con resultados reales.

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
