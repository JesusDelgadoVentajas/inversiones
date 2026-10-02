# Continuación F02–F08 — Activar la primera fuente verificada y acceso personal

- **Estado:** trabajo independiente local hasta F08 entregado; aceptación externa pendiente. [Evidencia](../evidencias/F02_F08.md).
- **Encargo vigente:** avanzar todo lo posible de F02 a F08 sin intervención del propietario, priorizando rigor. No habilitar datos ni reducir alcance para cerrar fases.
- **Resultado local:** API, identidad, UI, precio/histórico y M01 preparados con fixtures sintéticos; no hay proveedor real registrado ni despliegue.

## Entrada A: F01.04/F01.05 y F05 — Cloudflare personal

1. Conservar Wrangler OAuth existente. Workers Free fue confirmado por el propietario el 02-10-2026; la lectura de suscripciones no está disponible con el OAuth actual. Revisar facturación y cuotas, activar autenticación fuerte y guardar recuperación fuera del repo.
2. Configurar Zero Trust/Access gratuito para la identidad del propietario. El OAuth no tiene permiso Access; hace falta configuración del panel o una credencial adecuada. No compartir contraseñas/tokens por chat o Git.
3. Preparar protección del hostname completo y alternativas antes de publicar datos. Crear D1 separadas y configurar bindings solo con IDs reales. Mantener `APP_READY=false` y fuentes desactivadas para el primer armazón remoto. [Procedimiento](../DESPLIEGUE.md).
4. Verificar sesión válida/caducada, usuario ajeno, ruta alternativa, JWT real, móvil y CPU. El despliegue/push requiere autorización vigente; no se infiere de un commit. Cerrar G-ACCESO solo con resultados reales.

F01.04 conserva pendientes: cuenta/plan y ausencia de facturación comprobados; límites reales/responsable registrados en [COSTES](../COSTES.md); marcar el plan al satisfacer aceptación. No se borra esta tarea anterior ni se considera cerrada por Workers Free.

## Entrada B: F02 — Fuente gratuita de búsqueda y precios

1. Revisar derechos de display exclusivamente personal, conservación y corte de gasto del plan real. EODHD Free sigue candidato; Marketstack Free también puede ensayarse para EOD. [Revisión adicional](../evidencias/F02_FUENTES_ADICIONALES.md). Twelve Basic non-display no acredita uso en el panel.
2. Con la cuenta y claves privadas disponibles, ejecutar [la sonda](../../experiments/provider-spike/README.md) con límite explícito. Para SEC falta un contacto verdadero en `SEC_USER_AGENT`; no inventarlo. No dar de alta ni aceptar términos en nombre del propietario.
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

Si falta una entrada, avanzar por la otra solo dentro de lo autorizado. El trabajo local sintético de esta entrega no sustituye ninguna condición externa. [Estado integral](../ESTADO.md).
