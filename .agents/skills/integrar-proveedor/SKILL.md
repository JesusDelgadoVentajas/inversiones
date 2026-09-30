---
name: integrar-proveedor
description: Evaluar, integrar o reevaluar una fuente de datos financieros en este proyecto, verificando cobertura, derechos de uso, cuotas y contrato del adaptador.
---

# Integrar un proveedor financiero

Usa este procedimiento para añadir una fuente, habilitar un endpoint o revisar una capacidad cuyo plan, licencia o formato haya cambiado. Un ajuste de interfaz que consume un contrato existente no requiere esta skill.

## Entrada y referencias

Identifica proveedor, capacidad, mercados, instrumento y objetivo de la tarea. Si aún no están elegidos, compara los candidatos estrictamente necesarios para cubrir el hueco. Las claves se obtienen del entorno privado; no se solicitan en texto dentro del chat.

Desde esta carpeta, la raíz del proyecto está tres niveles arriba. Consulta las secciones pertinentes del [plan](../../../PLAN_CONSTRUCCION.md): 4–5 para coste y cobertura; 8–9 para contrato y cuotas; F02 para viabilidad o F06 para adaptadores. Aplica [los criterios de calidad](../../../docs/ia/CALIDAD.md) cuando escribas código.

## Evaluación

1. Comprueba documentación y condiciones oficiales vigentes. Registra fecha y URL de la fuente. Distingue acceso al endpoint, derecho de visualización personal, almacenamiento, retención y redistribución; que exista una clave gratuita no resuelve todos esos derechos.
2. Define la capacidad que se va a probar y su coste en llamadas. Ten en cuenta que local, staging y producción pueden compartir la misma cuota de cuenta. No introduzcas un producto facturable ni una prueba que pase automáticamente a pago.
3. Comprueba búsqueda e identidad para los instrumentos pertinentes, datos vacíos, moneda, escala, mercado, feed, timestamps, profundidad histórica y ajustes. Aplica la muestra internacional del plan cuando la aceptación sea de cobertura general; para una corrección concreta, acota la muestra al cambio.
4. Distingue las pruebas locales de las realizadas desde un Worker protegido. No habilites consultas con datos privados en un hostname desprotegido. Si falta una cuenta, credencial o permiso, documenta el bloqueo y avanza solo con trabajo independiente.
5. Registra una conclusión por capacidad y mercado: documentado, probado, no cubierto, acceso denegado, licencia insuficiente o fallo temporal, usando los estados del plan. No extrapoles un éxito de EE. UU. a otros países o una respuesta de precio a históricos y noticias.

## Integración cuando proceda

- Inspecciona los adaptadores, contratos y servicios existentes. Reutiliza transporte, normalización común, caché y cuotas; no copies una pila de acceso completa por proveedor.
- Mantén el formato propio de la fuente dentro de su adaptador y valida sus respuestas. Emite el contrato común conservando procedencia y limitaciones.
- Implementa plazos y reintentos acotados. Respeta `Retry-After` cuando corresponda; un 403 por plan no se arregla con un bucle de reintentos.
- Conserva el último dato válido según la política de caché sin cambiar su observación original. Un error parcial no debe convertirse en una cifra cero ni bloquear todos los bloques.
- Usa fixtures sintéticos o redistribuibles en pruebas de contratos y errores. Las consultas reales son pruebas separadas, limitadas y registradas; no se ejecutan en la CI ordinaria.

## Salida y aceptación

Actualiza los registros de proveedor, cobertura, costes y licencias previstos en F01/F02 según corresponda; créalos en esa fase si faltan. Usa la matriz de la sección 5.4, sin inventar un formato incompatible. Si ya existe `app/config/providers.json`, mantenlo coherente con las capacidades demostradas.

Entrega qué capacidades funcionan, en qué mercados y entornos, su frescura y límites, las comprobaciones realizadas y los huecos restantes. Conserva solo evidencia cuya publicación esté permitida; nunca incluyas claves, cabeceras de autorización o respuestas restringidas en Git.

Una integración solo está aceptada para el ámbito demostrado. El incumplimiento de coste o licencia impide activarla; la cobertura insuficiente mantiene abierta la aceptación correspondiente. Registra la decisión y el siguiente paso en el estado del proyecto.
