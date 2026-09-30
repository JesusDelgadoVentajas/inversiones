---
name: validar-metrica
description: Implementar o revisar una métrica financiera y su normalización, comprobando fórmula, unidades, periodos y resultados de referencia independientes.
---

# Validar una métrica financiera

Usa este procedimiento al añadir o corregir una fórmula, sus entradas o la normalización que determina su resultado. No requiere activarse por un cambio visual que no altere el significado o cálculo del dato.

## Entrada y referencias

Identifica la métrica M01–M32 o el nuevo requisito autorizado, el fallo o resultado esperado, los datos disponibles y el módulo afectado. Consulta la [sección 10 del plan](../../../PLAN_CONSTRUCCION.md#s10) y los casos afectados de la [sección 15](../../../PLAN_CONSTRUCCION.md#s15). Las reglas de implementación están en [CALIDAD.md](../../../docs/ia/CALIDAD.md).

La definición del plan es la referencia inicial. Si hay ambigüedad contable, contrasta fuentes primarias, registra la convención elegida y actualiza su documentación; no cambies silenciosamente el significado de una métrica ya publicada.

## Definición y compatibilidad

1. Especifica entradas, fórmula, unidad de salida, aplicabilidad, precisión, redondeo y motivo de ausencia. Si existe `docs/METRICAS.md`, actualiza la definición allí; se creará al implementar métricas.
2. Verifica entidad, clase o ADR, moneda, escala, atribución contable y periodos. Diferencia balances en una fecha de flujos durante un periodo.
3. Para TTM, usa periodos compatibles y no solapados. Deriva trimestres de acumulados solo para flujos aditivos adecuados; no extiendas esa resta a EPS, ratios, balances o promedios de acciones.
4. Conserva fuente, documento, fecha de publicación y revisiones. En un cálculo histórico, no uses información publicada después de la fecha de corte.
5. Identifica casos no aplicables, bases cero o negativas, datos ausentes y conversiones no disponibles. Devuelve una ausencia explicada cuando la fórmula no sea válida; no rellenes con ceros ni estimaciones inventadas.

## Implementación y comprobación

- Busca cálculos y normalizadores existentes; reutiliza la regla común sin duplicarla en interfaz y backend.
- Implementa una función determinista con entradas explícitas. Separa obtención de datos, cálculo y presentación; conserva precisión interna y redondea según la política acordada.
- Prepara resultados esperados mediante cálculo independiente antes de aceptar la implementación. Documenta la derivación de ejemplos sintéticos; no uses la propia función como oráculo de sus tests.
- Elige casos que puedan invalidar esta métrica: acumulados, trimestre ausente, beneficio cero, patrimonio negativo, cambio de moneda, escala, split, ADR, corrección de cuentas o ejercicio distinto del año natural. No ejecutes toda la lista si no afecta a la fórmula.
- Define tolerancias según unidad y redondeo. Evita tolerancias amplias sin justificación que oculten errores de escala o periodos.
- Para la aceptación de F09, completa también el contraste con documentos reales previsto en la sección 10.4. Una prueba sintética correcta no valida por sí sola el mapeo de un proveedor.

## Salida y aceptación

Entrega la definición aplicada, cambios de código, casos de referencia y sus resultados, trazabilidad y limitaciones. Comprueba que la interfaz explica la fórmula, fecha de entradas y motivo de no cálculo cuando corresponda.

Conserva únicamente fuentes y ejemplos cuya publicación esté permitida. Actualiza los tests afectados y el estado del proyecto. Si no hay entradas compatibles o queda una discrepancia sin resolver, registra el motivo y mantén pendiente la aceptación; no marques una métrica como válida por el mero hecho de compilar.
