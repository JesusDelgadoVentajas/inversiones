# Métricas implementadas

**Actualizado:** 2026-10-03. Catálogo M01–M32 implementado y probado localmente. Cinco métricas por empresa contrastadas con SEC para Apple, Microsoft y NVIDIA. F09 está en curso: no hay proveedor activo ni 20 métricas adicionales reales en la muestra internacional. G-CIFRAS sigue abierta. [Evidencia](evidencias/F02_F09_F10.md).

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

## Motor contable v1

[Cálculo](../app/shared/finance/metrics.ts), [periodos/versiones](../app/shared/finance/accounting.ts), [catálogo](../app/shared/finance/metric-catalog.ts) y [normalizador SEC](../app/worker/normalization/sec-concepts.ts) son módulos separados de red, reloj global, D1 y React.

- El corte histórico es explícito. Se conservan documento, accession, etiqueta, presentación, periodo, unidad, escala, criterio y atribución. `value` ya está expandido.
- `filedDate` conserva una fecha sin hora. Con solo esa fecha, un cálculo histórico excluye el día de presentación hasta el siguiente: no sabe a qué hora se publicó. `filedAt` solo admite un instante auténtico. No se usan periodos/presentaciones posteriores al corte.
- Para el mismo concepto, periodo, unidad, criterio y atribución se elige la última versión conocida. Las originales siguen en los hechos. Si hay valores contradictorios sin orden verificable, se muestra ausencia. La prioridad de etiquetas solo resuelve equivalencias numéricas, nunca oculta totales distintos.
- Flujos: año completo de 350–380 días, o cuatro trimestres contiguos de 60–120 días que cubran 350–380. Convención acotada para 52/53 semanas. Q2/Q3/Q4 se derivan de acumulados con inicio/unidad/criterio/atribución comunes. No aplicar a balances, EPS, dividendos por acción ni ratios.
- Balances: saldo publicado, sin sumas trimestrales. ROE exige patrimonio positivo en ambos extremos del periodo del beneficio, misma atribución y media inicio/fin.
- US GAAP e IFRS no se mezclan. Se implementan 14 etiquetas explícitas US GAAP para 10-K/10-Q y correcciones. IFRS, etiquetas propias, 20-F y otros formularios requieren mapeos adicionales. `NetIncomeLoss` es matriz; no sustituir por `ProfitLoss` con intereses no controladores. [Referencia FASB](https://xbrl.fasb.org/impdocs/OCI_TIG/othercompincome.htm).
- El parser rechaza enteros JSON fuera de precisión segura, unidades inapropiadas e identidad/metadatos inválidos. Acepta cadenas decimales exactas. Un futuro adaptador deberá preservar las cifras de origen antes de conversiones que pierdan precisión.
- Sin conversiones de divisa. GBX→GBP solo mediante `unitToMajor`. Ratios a seis decimales, empates alejándose de cero; importes exactos hasta el límite del contrato. Un resultado fuera de rango queda ausente.
- Las bases cero/negativas impiden ratios significativos. Crecimiento con esa base explica el cambio absoluto. Beneficio/patrimonio/caja libre negativos se conservan cuando son importes válidos.
- Las métricas heredan antigüedad; una actualización fallida no modifica sus fechas. La API agregada advierte si algún bloque usado era antiguo.

## Catálogo ejecutable

Porcentajes en %, ratios en veces, importes en moneda indicada y valores por acción en moneda/acción. Cada tarjeta permite consultar fórmula, entradas, periodos y fuentes.

| ID | Nombre | Fórmula/convención v1 |
|---|---|---|
| M01 | Variación de la sesión | (precio / cierre anterior compatible − 1) × 100 |
| M02 | Rentabilidad de precio a un año | (cierre ajustado final / inicial − 1) × 100 |
| M03 | Capitalización | Capitalización publicada para todas las clases pertinentes |
| M04 | Volumen de la sesión | Volumen del feed de la cotización |
| M05 | Máximo de 52 semanas | Máximo diario del histórico homogéneo ajustado por splits |
| M06 | Mínimo de 52 semanas | Mínimo diario del mismo histórico |
| M07 | Ingresos TTM | Ingresos de cuatro trimestres compatibles o un ejercicio anual completo |
| M08 | Crecimiento de ingresos | (TTM actual / TTM anterior − 1) × 100 |
| M09 | Beneficio neto TTM | Beneficio atribuible a la matriz de cuatro trimestres compatibles |
| M10 | Crecimiento del beneficio | (TTM actual / TTM anterior positivo − 1) × 100 |
| M11 | Beneficio por acción diluido | EPS de doce meses publicado en una base por acción verificada |
| M12 | Margen bruto | Beneficio bruto TTM / ingresos TTM × 100 |
| M13 | Margen operativo | Resultado operativo TTM / ingresos TTM × 100 |
| M14 | Margen neto | Beneficio atribuible TTM / ingresos TTM × 100 |
| M15 | Caja y equivalentes | Caja y equivalentes del último balance publicado |
| M16 | Deuda financiera bruta | Deuda financiera total, excluyendo arrendamientos según esta convención |
| M17 | Deuda neta | Deuda financiera bruta − caja y equivalentes |
| M18 | Patrimonio neto | Patrimonio atribuible a la matriz del último balance |
| M19 | Flujo operativo TTM | Flujos operativos de cuatro trimestres no solapados |
| M20 | Inversión en activos fijos TTM | Salidas positivas por compra de activos fijos |
| M21 | Flujo de caja libre TTM | Flujo operativo TTM − inversión en activos fijos TTM |
| M22 | Margen de caja libre | Flujo de caja libre TTM / ingresos TTM × 100 |
| M23 | PER histórico | Precio en moneda mayor / EPS diluido TTM positivo y compatible |
| M24 | Precio/ventas | Capitalización compatible / ingresos TTM positivos |
| M25 | Precio/valor contable | Capitalización de acciones comunes / patrimonio común positivo |
| M26 | Rentabilidad de caja libre | Flujo de caja libre TTM / capitalización positiva × 100 |
| M27 | ROE | Beneficio atribuible TTM / media de patrimonio compatible al inicio y fin × 100 |
| M28 | Ratio corriente | Activo corriente / pasivo corriente positivo del mismo balance |
| M29 | Deuda/patrimonio | Deuda financiera bruta / patrimonio positivo compatible |
| M30 | Dividendo por acción de doce meses | Dividendo publicado para la ventana y base por acción verificadas |
| M31 | Rentabilidad por dividendo histórica | Dividendo por acción de doce meses / precio compatible × 100 |
| M32 | Porcentaje de reparto | Dividendos comunes / beneficio atribuible a comunes positivo × 100 |

## Condiciones específicas

- M02/M05/M06: año diario, cobertura **completa acreditada por el adaptador**, splits documentados y serie homogénea. Separar dos extremos por un año no acredita continuidad. Los máximos/mínimos necesitan high/low reales; un cierre no los sustituye. Calendarios/ajustes reales siguen pendientes en F08.
- M03/M24/M25/M26: capitalización de todas las clases comunes publicada en la cotización, con emisor, moneda mayor, observación y procedencia propios. Fecha compatible con el precio. No multiplicar acciones diluidas medias ni usar un saldo contable antiguo. No hay fuente real aprobada.
- M04: volumen del feed identificado, sin extrapolarlo a mercado consolidado.
- M09/M18: atribución matriz; M25/M32: comunes explícitos. No asumir que matriz y comunes son equivalentes si hay preferentes.
- M16: excluir arrendamientos en v1. Total con definición verificada, o tres porciones completas: corto plazo, porción corriente y no corriente de largo plazo. Sin duplicar total/componentes ni convertir ausencia en cero. Mapeo SEC de composiciones todavía pendiente.
- M20: salidas positivas de compra de activos fijos, sin adquisiciones empresariales ni inversión automática de signo. M21/M22/M26 admiten caja libre negativa.
- M11/M23: EPS anual publicado, listing/clase/moneda/base actual por acción verificados. Sin suma trimestral de EPS ni sustitución por ADR/GDR. EPS desconocido/no positivo impide PER.
- M12/M13/M28: no aplicables cuando el perfil identifica banco/aseguradora; sector desconocido no se inventa.
- M30/M31: dividendo publicado del instrumento, base actual verificada y ventana civil exacta de doce meses terminada en el corte. Sin resta de acumulados ni hora inventada. La suma de pagos, especiales/splits y agenda de dividendos requiere F11; esa parte sigue pendiente.

## Límites y evidencia

Máximo 1.000 hechos normalizados, 120 variantes por concepto en la ventana relevante y 1.024 pasos de búsqueda TTM. Exceso produce ausencia/error explícito. Cada entrada conserva hasta 32 referencias sin truncado silencioso; respuesta API máxima 2 MB.

[Contabilidad](../app/tests/contracts/accounting.test.ts), [métricas](../app/tests/contracts/metrics.test.ts) y pruebas M01 cubren acumulados, trimestre ausente, 53 semanas, correcciones, fechas sin hora, pérdidas, bases cero/negativas, patrimonio negativo, monedas, banco, EPS/clase/ADR, GBX, dividendos y cobertura desconocida. Los resultados sintéticos se fijan mediante aritmética independiente.

El [contraste primario](evidencias/F02_F09_F10.md) usa tres empresas, cinco métricas y periodos anuales seleccionados, con oráculos independientes. No valida el TTM actual de cualquier empresa ni 20 métricas adicionales reales. CPU de Cloudflare, teléfono real, aceptación internacional y G-CIFRAS permanecen pendientes.
