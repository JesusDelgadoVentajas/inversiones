# Noticias: contrato e implementación local

**Actualizado:** 2026-10-03. F10 está en curso. API, filtros, saneado y vista probados con titulares sintéticos; normalizador regulatorio SEC contrastado localmente para Apple; **ninguna fuente real aprobada ni activa**. [Evidencia](evidencias/F02_F09_F10.md), [API](API.md) y [plan](../PLAN_CONSTRUCCION.md#f10).

## Identidad, clasificación y fechas

Cada artículo requiere UUID estable, URL HTTPS sin credenciales, titular, medio, idioma, fecha original y relación justificada con UUID de emisor. Se distingue emisor verificado, mapeo verificado de proveedor y referencia expresa. No basta una palabra del nombre: fruta «Apple» y homónimos con otra identidad quedan fuera. Verificar esa identificación desde una respuesta real sigue pendiente; un UUID sintético no demuestra el proceso.

Clasificación explícita: comunicado corporativo, noticia independiente, publicación regulatoria, sector o contexto macro. Si se omite, se rechaza; no se convierte en noticia independiente por defecto. Comparables/competidores dependen de F12.

Un instante UTC solo se admite si es auténtico; una fecha sin hora se conserva como fecha civil y la vista indica hora/zona desconocidas. Sin ambas, se rechaza. Consulta, descubrimiento y entrega no sustituyen publicación: una noticia antigua conserva su fecha original. Idioma desconocido se identifica como tal.

## Publicaciones regulatorias SEC

[Normalizador](../app/worker/normalization/sec-news.ts): exige CIK idéntico al perfil verificado, columnas alineadas, accession válido y nombre de documento seguro. Ofrece hasta veinte informes/comunicaciones regulatorias recientes seleccionadas (10-K/10-Q/8-K/20-F/6-K, correcciones y DEF 14A), con UUID v8 determinista por emisor/accession y enlace oficial. El título descriptivo identifica la presentación; no genera una noticia periodística ni una conclusión financiera.

La fecha es de **presentación**, marcada por dateKind, y la vista la identifica. acceptanceDateTime es recepción EDGAR, no una hora de publicación demostrada: no se usa como publishedAt. Los datos reales locales dieron veinte registros; firma/CPU/acceso Worker y registro del adaptador siguen pendientes.

## Saneado y deduplicación

[Módulo determinista](../app/shared/news/page.ts): eliminar marcado, scripts/estilos, controles y caracteres de dirección peligrosos; validar otra vez el resultado. React lo muestra como texto, sin HTML ejecutable. Las publicaciones no se usan como instrucciones.

URL canónica: eliminar fragmento y seguimiento conocido (utm, fbclid, gclid); conservar parámetros que identifican artículos. Deduplicar esa URL manteniendo la publicación original más temprana. Un UUID reutilizado para URLs diferentes produce error.

Titulares semejantes con enlaces distintos se mantienen: sin prueba de equivalencia, borrarlos puede eliminar información de otro medio. Política conservadora; agrupación por semejanza/evaluación editorial pendiente. [D011](DECISIONES.md#d011--fechas-precisas-y-calculos-conservadores-en-f09f10).

## Páginas y cuotas

Ventana máxima de 200 artículos del adaptador, filtrada por emisor/tipo y paginada de 20 en 20. No promete todo el archivo de la fuente; la vista informa de que puede haber publicaciones anteriores.

Cursor opaco base64url, acotado y validado por emisor, filtro, fecha de corte y clave de orden. No permite elegir URLs/proveedores ni se transmite como cursor de terceros. Un filtro nuevo reinicia la página. Cursor inválido se rechaza antes de llamar al proveedor; publicación futura conocida se excluye.

La fecha de corte permanece entre páginas, pero no hay una instantánea persistida del conjunto. Correcciones o descubrimientos de artículos antiguos pueden cambiar la ventana.

Sin refresco automático: abrir sección, cambiar filtro/página o actualizar genera una petición. Se respeta próximo refresco permitido, cancelación y sesión. El adaptador futuro debe usar el ejecutor común para cuotas, caché permitida y coordinación entre entornos. Un fallo no se convierte en lista vacía; al fallar una actualización, el bloque anterior se conserva como antiguo y mantiene su fecha.

## Fuentes y aceptación pendientes

Stocklake no entregó enlaces/medios suficientes. Finnhub tiene sonda, sin clave ni prueba real. El feed Apple no basta para autorizar republicación: sus términos genéricos restringen copia/uso de red y falta permiso aplicable. SEC puede aportar publicaciones regulatorias públicas con acceso justo, pero no sustituye noticias independientes. [Licencias](LICENCIAS.md).

No descargar/republicar artículos completos ni inventar sentimiento o frescura. Antes de activar una fuente: aprobar derechos de titulares/display/retención, relaciones/homónimos reales, fechas, idiomas, enlaces, ventana, cuota y Worker protegido. F10.01 y el cierre global siguen abiertos.
