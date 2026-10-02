# Continuación autónoma F01–F08

- **Encargo vigente:** completar el trabajo posible sin intervención del propietario entre F01 y F08; verificarlo, actualizar ticks/seguimiento y guardar los cambios pertinentes en un commit. El propietario retomó el desarrollo después del informe de fuentes; la parada anterior ya no está vigente.
- **Punto de partida:** [Stocklake/TGMCharts ensayadas](../evidencias/F02_BUSQUEDA_FUENTES.md), sin fuente principal aprobada. Armazón local F03/F04 y partes de F05–F08 comprobados con datos sintéticos. No publicar la web ni activar proveedores sin satisfacer las puertas correspondientes.
- **Resultado entregado:** dos D1 privadas separadas y cinco migraciones verificadas en Cloudflare; contacto SEC auténtico privado y dos endpoints locales probados; sondas Stocklake/TGMCharts/Finnhub-news reproducibles; controles de configuración y secretos reforzados; 101 pruebas locales pasan. [Evidencia](../evidencias/F01_F08_CONTINUACION.md). F01.07/F05.01 se marcan completas con su ámbito real; el resto de aceptaciones externas permanece abierto.
- **Bloqueos conservados:** Access/MFA/facturación, claves de otras fuentes, prueba de móvil/CPU y aprobación internacional de datos. El contacto SEC está resuelto en local; no acredita extracción XBRL ni acceso desde Worker. No se inventan credenciales ni se crean cuentas de datos por el titular.
- **Siguiente unidad:** F01.05/F05.03, configurar Access gratuito para la identidad del propietario y todos los accesos, con AUD reales distintos por entorno. Requiere panel o delegación adecuada porque el OAuth actual carece de permiso Access. El trabajo autónomo restante de esta entrega está terminado; no publicar por haber creado el commit.

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
2. Con la cuenta y claves privadas disponibles, ejecutar [la sonda](../../experiments/provider-spike/README.md) con límite explícito. SEC ya tiene contacto verdadero privado; submissions/directorio están probados en local. Las fuentes sin clave tienen sondas repetibles y límites conocidos; continuar solo para una duda concreta. No dar de alta ni aceptar términos en nombre del propietario.
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
