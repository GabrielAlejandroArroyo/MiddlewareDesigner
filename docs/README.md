# Documentación del producto — Middleware Designer

Índice de la documentación del producto y referencias a seguridad y autenticación.

## Documentos principales

- **[Requisitos de producto (PRD)](PRD.md)** — Descripción del producto, flujos, API y modelo de datos, incluyendo seguridad y login.
- **[Autenticación (auth)](auth.md)** — Login en el middleware: Basic Auth, variables de entorno, flujo desde el MFE y pasos futuros para Keycloak (OIDC).
- **[Documentación completa (DOCUMENTACION-COMPLETA.md)](DOCUMENTACION-COMPLETA.md)** — README principal, tabla resumen de archivos, docstrings sugeridos, diagrama Mermaid y análisis del proyecto.
- **[Middleware README](../documentacion/middleware/README.md)** — Tecnologías, lógica de resolución, despliegue con Docker.

## Gestión de Aplicaciones

- **Pantalla "Aplicaciones"** en el Designer UI (`/apps`): crea y configura aplicaciones con roles, módulos por rol y menú personalizable.
- **App Runtime MFE** (`microfrontends/app-runtime/`, puerto 4201): microfrontend separado que sirve las aplicaciones generadas con su menú y módulos configurados.
- Ver la sección "Gestión de Aplicaciones" en [PRD.md](PRD.md) para API, modelo de datos y flujos.

## Otra documentación

La documentación detallada de arquitectura, frontend, middleware y servicios se encuentra en la carpeta **`documentacion/`** del repositorio (PRD extendido, arquitectura, catálogo de servicios, etc.).

## Seguridad y login

El middleware permite proteger las rutas de configuración mediante autenticación:

- **Actual**: Basic Auth (usuario y contraseña en variables de entorno).
- **Preparado para**: IAM como Keycloak (OIDC/JWT).

Ver [auth.md](auth.md) para variables de entorno, rutas protegidas y flujos.
