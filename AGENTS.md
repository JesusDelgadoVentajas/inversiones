# Instrucciones del proyecto

## Preferencias del propietario

- Prioriza calidad, corrección y comprobación sobre velocidad. El propietario prefiere que te tomes el tiempo necesario para hacer bien el trabajo y verificarlo, salvo que pida expresamente «hazlo rápido» o equivalente.
- Trabajar con rigor no significa investigar indefinidamente: cuando los criterios estén satisfechos y las comprobaciones pertinentes pasen, termina y entrega el resultado.
- Si pide rapidez, acota el trabajo y prioriza las verificaciones esenciales; indica lo que quede pendiente. Nunca presentes comprobaciones omitidas como realizadas.
- Comunícate en español, con explicaciones claras de lo cambiado, lo comprobado y las limitaciones reales.

## Al comenzar o retomar una tarea

1. Inspecciona los archivos y el estado de Git; conserva el trabajo existente del propietario.
2. Consulta [docs/ESTADO.md](docs/ESTADO.md) y, si continúas la construcción, [la tarea actual](docs/tareas/tarea-actual.md).
3. Lee las secciones del [plan](PLAN_CONSTRUCCION.md) y las decisiones relacionadas con el cambio. Usa el mapa siguiente; no releas toda la documentación antes de cada edición.
4. Sigue el encargo vigente del propietario. Si cambia la prioridad, actualiza el seguimiento sin perder los pendientes anteriores.

| Trabajo | Referencia que corresponde consultar |
|---|---|
| Alcance, fases y aceptación | Plan, secciones 2 y 14–15. |
| Arquitectura, carpetas y comandos | Plan, secciones 3 y 13; [decisiones](docs/DECISIONES.md). |
| Escribir o revisar código | [Criterios de calidad](docs/ia/CALIDAD.md). |
| Integrar o reevaluar un proveedor | Plan, secciones 4–5 y 8–9; skill [integrar-proveedor](.agents/skills/integrar-proveedor/SKILL.md). |
| Implementar o corregir una métrica | Plan, sección 10; skill [validar-metrica](.agents/skills/validar-metrica/SKILL.md). |
| Acceso, secretos o despliegue | Plan, secciones 12 y 16 y la fase afectada. |

Las skills tienen un ámbito concreto: no cargues ambas para una tarea que no las necesita. Añade instrucciones específicas de una carpeta solo cuando existan reglas locales que lo justifiquen.

## Código sencillo, modular y reutilizable

- Implementa el mínimo código necesario para resolver la tarea de forma completa y comprensible. No añadas funciones de producto, dependencias ni capas por anticipación.
- Separa presentación, orquestación, acceso a proveedores, persistencia y cálculos. Cada módulo debe tener una responsabilidad coherente; no concentres la aplicación en un archivo ni la fragmentes sin motivo.
- Busca funciones y contratos existentes antes de crear otros. Reutiliza la lógica que representa la misma regla de negocio y elimina duplicaciones introducidas por tu cambio.
- Extrae abstracciones cuando simplifiquen necesidades concretas. Dos fragmentos parecidos con responsabilidades distintas no obligan a crear una función genérica.
- Usa nombres precisos, flujo explícito y contratos claros. Evita trucos para ahorrar líneas, dependencias circulares y lógica de negocio en componentes visuales.
- Mantén los cálculos deterministas y separados de red, reloj e interfaz. Valida los datos externos en el límite de entrada.
- Mantén los cambios centrados en el encargo. Documenta mejoras ajenas a su alcance sin iniciar una reescritura general.

## Restricciones del producto

- Servicios con presupuesto de 0 €, acceso personal protegido, interfaz en español y búsqueda abierta por nombre de empresa cotizada.
- No inventes cifras, noticias, cobertura ni frescura. Conserva fuente, instrumento, unidad, moneda y fechas; distingue ausencia, cero, estimación y dato antiguo.
- No incorpores secretos ni datos cuya redistribución esté restringida a Git, al frontend o a registros compartidos. Usa datos sintéticos identificados para pruebas.
- Los proveedores siguen siendo candidatos hasta superar las pruebas y condiciones del plan. Un mock, una documentación o una consulta local no demuestran acceso real desde Cloudflare.
- Una limitación externa se registra con su efecto. No reduzcas silenciosamente el alcance ni el rigor para marcar una fase como completa.

## Ejecución y verificación

- Avanza dentro del trabajo autorizado sin pedir permiso de nuevo para leer, editar, revisar o ejecutar comprobaciones locales pertinentes. Respeta los permisos ya otorgados y los límites reales del entorno.
- Pregunta solo cuando falte información esencial o una acción requiera autorización que no exista. Prepara antes el resultado revisable y continúa las tareas independientes posibles.
- No delegues ni actives varios agentes salvo petición explícita del propietario. Una revisión separada puede hacerse en otra pasada de la misma sesión.
- Antes de cerrar, ejecuta las comprobaciones proporcionadas al cambio y revisa el diff. Corrige fallos atribuibles al trabajo; no debilites pruebas o validaciones para conseguir un resultado verde.
- Distingue revisión documental, prueba local, prueba en Cloudflare y aceptación del propietario. Explica pruebas omitidas o bloqueadas.
- Ejecuta pruebas afectadas mientras implementas y las comprobaciones exigidas al cerrar la entrega. Repite o amplía solo cuando haya cambios, fallos o dudas concretas que lo justifiquen.

## Comandos y estado real

La existencia de herramientas y scripts se verifica en los archivos del proyecto, no se deduce del plan. Mientras no exista `app/package.json`, no hay aplicación que instalar, compilar o probar con npm. Los scripts de la sección 13.3 son un contrato futuro; incorpóralos en F03 y actualiza el README con los comandos que funcionen realmente.

Para cambios documentales, comprueba enlaces y rutas locales, coherencia de estados, sintaxis de los ejemplos afectados y `git diff --check`. Para skills, comprueba también frontmatter, ámbito de activación y referencias.

## Al entregar

- Actualiza [el estado](docs/ESTADO.md) con evidencia y una siguiente tarea concreta. Mantén el plan como fuente de requisitos y checklist; las decisiones importantes van en [el registro](docs/DECISIONES.md).
- Marca una tarea o fase como completa solo si satisface su aceptación. Un bloqueo de una parte no impide documentar el trabajo independiente completado.
- Si se solicita un commit, revisa y añade únicamente los archivos pertinentes. Usa una frase en inglés con prefijo adecuado como `docs/`, `feat/` o `fix/`; no incluyas cambios ajenos.
- Entrega un resumen breve: resultado, comprobaciones, pendientes materiales y commit cuando proceda. No hagas push ni publiques por el mero hecho de haber hecho un commit.
