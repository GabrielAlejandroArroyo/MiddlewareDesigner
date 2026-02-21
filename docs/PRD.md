# Product Requirements Document (PRD) — Middleware Designer

Documento de requisitos del producto. Para el PRD completo (descripción, usuarios, funcionalidades por capa, flujos, API y modelo de datos) ver **[../documentacion/PRD.md](../documentacion/PRD.md)**.

Esta página resume las secciones afectadas por **seguridad y autenticación** en el middleware.

---

## Seguridad y autenticación en el middleware

### Descripción

El middleware incluye un sistema de login configurable:

- **Recomendado**: autenticación **Database Auth** (`AUTH_TYPE=database`), contra el servicio Usuario. Permite flujo completo: admin con contraseña por defecto, cambio obligatorio al primer login y `requiere_cambio_password`.
- **Alternativa**: **Basic Auth** (usuario y contraseña configurados por variables de entorno; `AUTH_TYPE=basic`).
- **Preparado para**: conectar un IAM como **Keycloak** (OIDC/JWT) en el futuro, sin cambiar la lógica de rutas.

### Rutas afectadas

| Ruta | Protegida | Notas |
|------|-----------|--------|
| `GET /` | No | Health/welcome; útil para balanceadores y comprobación de que el servicio está vivo. |
| `GET /docs`, `GET /openapi.json` | No | Documentación. |
| `/api/v1/config/*` | Sí | Todas las operaciones de configuración (backends, mapeos, inspect, refresh, etc.) requieren autenticación. |

### Flujo de usuario (Designer UI)

1. El usuario accede al Designer UI. Si el middleware exige auth y no hay credenciales, la primera petición devuelve **401** y el frontend redirige a **/login**.
2. En la pantalla de login el usuario introduce usuario y contraseña.
3. Tras un login correcto, si `requires_password_change=true` (p. ej. admin con contraseña por defecto), se redirige a **/cambiar-password**; en caso contrario al panel principal.
4. Si se requiere cambio, el usuario introduce contraseña actual, nueva y confirmación; al completar pasa al panel principal.
5. Un interceptor HTTP añade el header `Authorization` a todas las peticiones al middleware.
6. Si en cualquier momento el middleware devuelve **401**, se limpian las credenciales y se redirige de nuevo a **/login**.

### API y OpenAPI

- Las rutas bajo `/api/v1/config` requieren el header `Authorization: Basic <base64(user:password)>` (o en el futuro `Bearer <JWT>`).
- El OpenAPI del middleware declara el esquema de seguridad **BasicAuth** para que Swagger UI permita probar con usuario y contraseña.

### Configuración

Ver **[auth.md](auth.md)** para variables de entorno (`AUTH_TYPE`, `MIDDLEWARE_AUTH_USER`, `MIDDLEWARE_AUTH_PASSWORD`, y opciones OIDC para Keycloak) y detalles de implementación.

### Despliegue con Docker

El middleware incluye un `Dockerfile`. Construir: `docker build -t middleware-designer ./middleware`. Ejecutar: `docker run -p 9000:9000 middleware-designer`. Ver [documentacion/middleware/README.md](../documentacion/middleware/README.md) para instrucciones completas.

---

## Referencias

- [documentacion/PRD.md](../documentacion/PRD.md) — PRD completo.
- [auth.md](auth.md) — Autenticación en el middleware (Basic y preparado para Keycloak).
