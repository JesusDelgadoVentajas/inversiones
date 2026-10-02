# F02 — Revisión de otras fuentes gratuitas de precios

**Fecha:** 2026-10-02. Revisión de documentación oficial, sin crear cuentas, aceptar términos ni consultar APIs de precios. Todas las capacidades indicadas son **DOCUMENTADAS**, no probadas desde el equipo ni desde Worker. Ninguna fuente se incorpora al registro de proveedores activos.

Esta revisión corresponde a los tres candidatos de la tabla. La [búsqueda posterior de Stocklake, TGMCharts y otras fuentes](F02_BUSQUEDA_FUENTES.md) sí incluye consultas financieras locales sin cuenta; no cambia el estado documental de los tres proveedores siguientes.

| Candidato | Plan gratuito descrito por la fuente | Hueco o condición para esta app |
|---|---|---|
| Alpha Vantage | [Soporte](https://www.alphavantage.co/support/): hasta 25 peticiones/día; precio estadounidense en tiempo real o retrasado 15 minutos requiere premium. [API](https://www.alphavantage.co/documentation/): diario raw compacto de 100 puntos; diario completo y diario ajustado son premium. | No acredita precio intradía gratuito ni un año **diario ajustado** gratuito. Hay otras resoluciones que deben evaluarse por separado; no se descarta todo histórico. Faltan identidad por nombre, mercados, derechos de visualización/retención y prueba con clave personal. |
| Twelve Data Basic | [Precios](https://twelvedata.com/pricing): 8 créditos/minuto, 800/día, acciones estadounidenses y uso interno **non-display**. Mercados internacionales aparecen sujetos a otras modalidades o prueba. | Sus [términos](https://twelvedata.com/terms) distinguen non-display de mostrar información a personas. La pantalla personal de esta app es visualización: la oferta Basic consultada no acredita permiso suficiente. **LICENCIA_INSUFICIENTE** mientras no exista autorización aplicable; no activar por la cuota o la promesa de tiempo real. |
| Marketstack Free | [Precios](https://marketstack.com/pricing/): 100 peticiones/mes, cierre diario, un año histórico, HTTPS, splits y dividendos; uso no comercial. | Merece una prueba EOD acotada si la licencia permite mostrar y retener datos en un panel personal. 100/mes limita mucho la consulta abierta y el refresco. No prueba intradía, amplitud internacional del plan Free, búsqueda por nombre ni comportamiento al agotar cuota. |

## Decisión y siguiente ensayo

No hay nuevo proveedor primario. Las cuotas se presupuestarán entre local, staging y producción cuando exista cuenta real; «gratis» no autoriza altas que activen cobro o pruebas que se conviertan en pago.

Para un ensayo de EODHD Free o Marketstack Free: primero comprobar términos de visualización exclusivamente del titular, conservación y corte sin gasto; después obtener una clave privada y hacer un muestreo con presupuesto explícito. Registrar MIC, instrumento, moneda/unidad, feed, observación, últimos días y ajuste, incluyendo España, otro mercado europeo y Japón. Un resultado estadounidense no acepta el resto del mundo. Consultar la [matriz de cobertura](../COBERTURA.md) y [la skill](../../.agents/skills/integrar-proveedor/SKILL.md).

Referencias de términos aún pendientes de evaluación completa: [Alpha Vantage](https://www.alphavantage.co/terms_of_service/) y [APILayer/Marketstack](https://www.ideracorp.com/legal/APILayer). No se deduce un permiso de display o almacenamiento de la etiqueta «no comercial».
