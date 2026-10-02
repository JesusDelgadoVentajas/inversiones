# F01–F08 — D1 remotas y ensayos reproducibles

**Fecha:** 2026-10-03, Europe/Madrid. Acciones remotas y consultas entre el 02 y el 03 de octubre; las horas de proveedores se registran en UTC. Encargo: avanzar cuanto fuera posible sin intervención del propietario, comprobarlo y guardarlo en un commit. La parada del [informe anterior](F02_BUSQUEDA_FUENTES.md) quedó revocada por este encargo.

## F01 y F05: infraestructura realmente creada

1. Se comprobó la sesión OAuth existente de Wrangler: una cuenta, permisos de Workers y D1, sin permiso de Access. No se imprimieron correo, ID de cuenta ni credenciales. El propietario ya había confirmado Workers Free; el OAuth no permite verificar suscripciones, facturación o MFA.
2. Se revisó la [tarifa D1 Free](https://developers.cloudflare.com/d1/platform/pricing/): 5 millones de filas leídas/día, 100.000 escritas/día y 5 GB. El exceso de Free bloquea operaciones; no se seleccionó una modalidad de pago.
3. El listado inicial no contenía D1. Se crearon secuencialmente `inversiones-staging` e `inversiones-production`, ubicación sugerida WEUR, sin actualización automática de configuración. Sus UUID reales y diferentes constan en [wrangler.jsonc](../../app/wrangler.jsonc); son identificadores de recursos, no credenciales.
4. Después de probar las migraciones locales, se aplicaron las cinco migraciones a staging y después a producción. Se verificó por SQL remoto la lista de migraciones, las tablas, su contenido vacío y la ausencia de infracciones de claves foráneas.

| Verificación remota | Staging | Producción |
|---|---|---|
| Migraciones registradas | `0001_core`, `0002_cache_access`, `0003_provider_slots`, `0004_cache_origin`, `0005_identity_immutability` | Las mismas cinco |
| Tablas de aplicación | Nueve presentes | Nueve presentes |
| Filas en cada tabla de aplicación | Cero | Cero |
| `PRAGMA foreign_key_check` | Sin filas | Sin filas |
| Tamaño comunicado tras migrar | 151.552 bytes | 151.552 bytes |

Las nueve tablas son `companies`, `listings`, `provider_mappings`, `cache_entries`, `provider_budgets`, `refresh_leases`, `preferences`, `provider_status` y `provider_slots`. Los metadatos internos de D1/migraciones sí tienen su estado propio. No se almacenaron respuestas financieras ni fixtures reales.

**F05.01 completada.** Las bases siguen privadas y solo se consultaron mediante la sesión autorizada de la cuenta. No se desplegó ningún Worker, ni se configuró Access, ni se obtuvo URL de la aplicación. Crear D1 no demuestra acceso personal protegido, consultas desde un Worker ni CPU de autenticación. [D010](../DECISIONES.md#d010--d1-privadas-antes-del-despliegue-del-worker) y [procedimiento pendiente](../DESPLIEGUE.md).

**Mecanismo local de F01.07:** exclusiones Git comprobadas antes del contacto; configuración SEC conservada en un archivo 0600 dentro de `.local/`, con directorio privado, y sesión OAuth gestionada por Wrangler. El correo verificado de la cuenta se usó como contacto real SEC, exclusivamente en el entorno del proceso y archivo privado. No se creó una cuenta financiera ni se inventaron claves o identidad. Las futuras claves financieras y secretos por entorno siguen pendientes.

## F02: consultas locales nuevas

Las sondas usan el ejecutor existente: casos explícitos, presupuesto de 1–10 peticiones, pausa de 1,1 s, timeout, cuerpo máximo de 2 MB, rechazo de redirecciones y parada por proveedor tras 401/403/429. Solo salen estados y metadatos definidos. Ninguna consulta de esta tabla ocurrió desde Cloudflare.

| Caso y hora UTC | Resultado | Alcance y límite |
|---|---|---|
| SEC `sec-submissions`, 02-10 21:57:08 | HTTP 200; 164.435 bytes; 366 ms | CIK de Apple coincide y existen accession numbers. No prueba interpretación XBRL ni métricas. |
| SEC `sec-directory`, 02-10 22:12:02 | HTTP 200; 523.512 bytes; 632 ms | 10.434 filas; «Apple» coincide con seis filas de seis emisores. No elegir la primera ni confundir CIK con cotización. |
| Stocklake MCP initialize, 02-10 22:11:59 | HTTP 200; protocolo 2025-11-25 | Inicialización incluida en el presupuesto; sesión solo en memoria, sin registrarla. |
| Stocklake `stocklake-name`, 02-10 22:11:59 | HTTP 200; Microsoft → MSFT, USD, alias NMS | Actualización general declarada; observación/feed de la cotización ausentes. |
| Stocklake `stocklake-history`, 02-10 22:12:00 | HTTP 200; cinco barras AAPL, 28-09–02-10, `ibkr` | OHLC/volumen y orden válidos; moneda y ajuste no declarados. No sustituye el muestreo anual anterior. |
| TGM `tgm-summary`, 02-10 22:13:12 | HTTP 200; USD, cierre 02-10, `fmp-delayed` | `dataUpdatedAt` 21:05:29.673Z; no hora propia de observación. |
| TGM `tgm-series`, 02-10 22:13:13 | HTTP 200; 502 puntos, 02-10-2024–02-10-2026 | P/E diario, unidad ratio, metodología declarada. No es histórico de precio; fórmula sin validar. |
| TGM `tgm-statements`, 02-10 22:17:47 | HTTP 200; 7.973 bytes; dos periodos con fin 28-09-2024 y 27-09-2025 | Metadatos tag/accession/fecha por valor presentes; actualización declarada 10-09-2026. Importes no contrastados con SEC ni 20 métricas demostradas. |

En esta continuación se hicieron tres peticiones MCP (dos herramientas), dos GET SEC y nueve GET TGM. Los seis primeros GET TGM ejecutaron dos veces el grupo de tres: el informe del primer grupo no se conservó; la segunda ejecución permitió localizar la validación fallida. Dos consultas diagnósticas adicionales inspeccionaron estructura/metadatos sin importes: Python recibió 403 y Node 200. La última petición verificó la corrección. No se cambió IP, cuenta ni plan para eludir límites. La cuota restante Stocklake no volvió a medirse; no se afirma una cifra nueva.

La sonda de cuentas rechazaba una etiqueta XBRL legítima de más de 80 caracteres porque reutilizaba el límite de un alias corto. Se separó la validación de tag y se añadieron casos sintéticos de etiquetas largas, cuentas vacías y periodos inválidos. La corrección conserva la exigencia de procedencia por valor y fin/fecha de presentación compatibles; no acredita corrección contable. Los cuerpos se procesaron en memoria y no se guardaron.

La [SEC permite reutilizar información gubernamental y documentos públicos EDGAR](https://www.sec.gov/about/webmaster-frequently-asked-questions), con excepciones para material de terceros. Su [API](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) y [acceso automatizado](https://www.sec.gov/about/developer-resources) exigen identificar al responsable y respetar el máximo de 10 solicitudes/s entre máquinas. Submissions/directorio quedan probados localmente; no se aprobó todavía un adaptador, mapeo mundial, extracción de cuentas o presupuesto CPU en Workers.

Se añadieron sondas para noticias Finnhub con URL HTTPS, atribución y fecha dentro de una ventana explícita; **sin consulta real**, porque falta clave. Se documentaron ventanas configurables, handshake obligatorio y errores MCP internos aunque HTTP sea 200. [Guía de repetición](../../experiments/provider-spike/README.md). [Cobertura por capacidad](../COBERTURA.md).

## Comprobaciones locales y límites

- `npm run check`: **101 pruebas pasan**: 21 de sondas, nueve de scripts, 22 de contratos/cálculos, 35 de Workerd/D1 y 14 de Chromium en escritorio/320 px. Incluye tipos estrictos, lint sin avisos, migraciones desde vacío/versión previa, configuración y ambos builds.
- Las compilaciones contienen la D1 correcta por entorno, `APP_READY=false`, `ALLOW_LIVE_PROVIDERS=false` y `preview_urls=false`; no hay previews con nombre ni proveedores registrados. Las pruebas de configuración rechazan bases compartidas, nombres/UUID cruzados, binding local remoto y habilitación de datos.
- Se ejecutó la comprobación con el contacto SEC real y una clave canario sintética en el entorno; no aparecieron en artefactos, salida de compilación ni informes. El detector revisa patrones y valores privados conocidos, incluyendo formas JSON/URL/base64 y el correo dentro del User-Agent. No certifica un secreto desconocido sin patrón.
- Una prueba de CLI en un repositorio temporal genera un mapa sintético con un secreto, comprueba rechazo y diagnóstico sin valor, lo elimina y comprueba recuperación. También comprueba rechazo de un archivo privado añadido forzosamente a Git. El build normal no genera mapas; el escáner revisa todos los que existan en `dist/`.
- F05.07 conserva pendiente la comprobación con secretos y registros remotos tras F05.06; las pruebas locales se documentan sin cerrar esa aceptación externa.
- Se revisaron enlaces/rutas documentales, sintaxis de scripts, checklist, diff y exclusión de material privado. No se repitió la instalación limpia: no cambiaron dependencias ni lockfile, y la reproducción anterior sigue documentada en [F02–F08](F02_F08.md).

**Pendiente real:** facturación/MFA, Access/AUD/identidad permitida, secretos por entorno, despliegue inerte protegido, JWT/móvil/CPU reales; fuentes aprobadas y suficientes para búsqueda abierta, cotización observada, histórico ajustado y muestra internacional. F01/F02/F05–F08 permanecen abiertas. Se entregan los pasos independientes completos, sin push ni publicación del Worker. [Estado](../ESTADO.md) y [siguiente tarea](../tareas/tarea-actual.md).
