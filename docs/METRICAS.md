# Métricas implementadas

**Actualizado:** 2026-10-02. Solo M01 tiene cálculo local implementado. El catálogo M01–M32 y la aceptación con documentos reales siguen en el [plan, sección 10](../PLAN_CONSTRUCCION.md#s10); F09 todavía no ha empezado.

## M01 — Variación respecto al cierre anterior

**Código:** `app/shared/finance/price-change.ts`. **Convención:** diferencia absoluta `precio − cierre anterior`; porcentaje `(precio / cierre anterior − 1) × 100`. La salida absoluta conserva la unidad cotizada; la salida relativa se expresa en porcentaje. No mide rentabilidad total ni incorpora dividendos.

Entradas: cotización normalizada y cierre anterior aportado con su procedencia. Deben coincidir UUID del instrumento, divisa, unidad cotizada, factor de conversión y feed. El cierre tiene que preceder al instante observado del precio y estar expresado por las acciones actuales (`shareBasis: current_shares`). El adaptador deberá verificar que realmente sea el cierre de la sesión anterior correspondiente; el orden temporal por sí solo no demuestra ese hecho. Todavía no hay adaptador real que lo compruebe.

Un split exige un cierre anterior convertido a la base actual por una fuente verificada. Esta función no descubre splits ni ajusta importes por su cuenta. ADR, clases, bolsas, monedas y feeds distintos no se sustituyen entre sí. La falta de referencia, incompatibilidad o base cero devuelve ausencia con un código de motivo, nunca un cero inventado. La interfaz muestra la fecha de ambas entradas y la fórmula.

**Precisión:** entradas decimales de hasta 12 posiciones, cálculo con enteros `BigInt`. Diferencia exacta dentro del contrato; porcentaje redondeado a 6 decimales, empates alejándose de cero. La presentación elimina ceros finales; los importes presentados no se reutilizan como entradas. `Number` solo se usa para la geometría orientativa del gráfico, ajena a este cálculo.

## Referencias sintéticas independientes

Las expectativas están fijadas mediante aritmética directa en `app/tests/contracts/market.test.ts`; la función probada no genera los resultados esperados. Se comparan cadenas exactas, sin tolerancia porcentual amplia.

| Precio / referencia | Derivación independiente | Diferencia / porcentaje esperado |
|---|---|---|
| 12,34 / 10 | `12,34 − 10 = 2,34`; `2,34 / 10 × 100 = 23,4`. | `2.34` / `23.4`. |
| 9 / 10 | `−1 / 10 × 100 = −10`. | `-1` / `-10`. |
| 2 / 3 | `−1 / 3 × 100 = −33,333333…`. | `-1` / `-33.333333`. |
| 1,000000000001 / 1 | Diferencia `10⁻¹²`; porcentaje `10⁻¹⁰`, inferior al redondeo mostrado. | `0.000000000001` / `0`. |
| 50 / 50 tras split 2:1 | Cierre original 100 convertido a 50 por acción actual. | `0` / `0`. |
| 50 / 100 con base de acciones desconocida | No se puede comparar una acción actual con la base anterior sin verificar el ajuste. | Ausencia por incompatibilidad. |

También se rechazan cambio de instrumento, divisa, feed, instante de referencia posterior o igual, y base cero. Se prueba el orden correcto de instantes con fracciones de segundo.

**Validación conseguida:** fórmula y contrato locales con fixtures sintéticos. **Pendiente:** procedencia y mapeo reales, cierre de sesión correcto, ajustes reales y contraste documental. No equivale a aprobar un proveedor ni a completar F08/F09.
