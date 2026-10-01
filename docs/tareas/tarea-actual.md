# F01.04 — Verificar Cloudflare Free y preparar acceso personal

- **Estado:** PENDIENTE por acceso a la cuenta de Cloudflare.
- **Dependencias:** F01.01–F01.03 completadas; armazón F03 disponible.
- **Objetivo:** verificar que la cuenta del propietario admite Workers Free y registrar límites reales sin activar servicios facturables.

## Pasos

1. El propietario inicia sesión en su cuenta de Cloudflare por un mecanismo seguro local. No compartir contraseñas, tokens ni códigos de recuperación por chat o Git.
2. Verificar cuenta, plan Workers Free, facturación y cuotas vigentes; registrar fecha y evidencia saneada en [costes](../COSTES.md).
3. Configurar Access gratuito y un método personal de ingreso (F01.05). Comprobar que la protección cubra el hostname de ensayo **antes** de consultar proveedores o publicar datos. Revisar el caso de rutas `*.workers.dev` y previews.
4. Ya con protección demostrada, desplegar una sonda Worker sin claves/datos y verificar acceso autorizado y denegado (F02.02). El despliegue requerirá autorización según el alcance de la sesión vigente; nunca asumirla de un simple commit.
5. Revisar las cuentas gratuitas de datos y claves que falten (F01.06–F01.07); ejecutar la [sonda local](../../experiments/provider-spike/README.md) con presupuesto explícito, sin subir resultados privados.

## Cierre

- [ ] Cuenta y plan Free reales comprobados; ninguna facturación no deseada.
- [ ] Límites y responsable registrados en `docs/COSTES.md`.
- [ ] F01.04 marcada en el plan; continuar F01.05 y F02 según dependencias.

El estado integral está en [ESTADO.md](../ESTADO.md). No marcar esta tarea con base exclusiva en páginas de precios públicas.
