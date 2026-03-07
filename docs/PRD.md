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

## Gestión de Aplicaciones

### Descripción

El sistema permite definir aplicaciones personalizadas desde el Designer UI. Cada aplicación se configura con roles, módulos accesibles por rol, y un menú personalizable. Las aplicaciones generadas son accesibles desde un microfrontend runtime separado (`app-runtime`, puerto 4201).

### Pantalla "Aplicaciones" en Designer UI

Ruta: `/apps` en el Designer UI. Permite:

1. **Crear/editar aplicaciones** con nombre, descripción, slug (URL) y vinculación opcional a una aplicación del microservicio `aplicacion` (puerto 8005).
2. **Asignar roles** disponibles: se cargan **todos los roles** del servicio `roles` (8006) y del servicio `aplicacion-role` (8008). Si la app está vinculada a una aplicación del microservicio, los roles se agrupan visualmente: primero los roles que pertenecen a esa aplicación (por `id_aplicacion` o vínculo en `aplicacion-role`), luego el resto de roles disponibles. Si no está vinculada, se muestran todos los roles sin agrupamiento. Al asignar un rol, se sincroniza opcionalmente con el servicio `aplicacion-role`.
3. **Configurar módulos por rol**: seleccionar qué endpoints habilitados de cada backend service son accesibles por cada rol.
4. **Diseñar el menú**: auto-generado desde los módulos seleccionados, con opción de personalización manual (etiquetas, iconos, jerarquía).
5. **URL de acceso**: muestra la URL del runtime donde los usuarios finales acceden a la aplicación.

### Integración con microservicios

La pantalla de Aplicaciones consume directamente los siguientes microservicios vía proxies del dev server Angular:

| Proxy | Microservicio | Puerto | Uso |
|-------|---------------|--------|-----|
| `/aplicacion-api` | aplicacion | 8005 | Listar aplicaciones existentes para vincular |
| `/roles-api` | roles | 8006 | Listar roles disponibles, filtrados por aplicación |
| `/aplicacion-role-api` | aplicacion-role | 8008 | Sincronizar vínculos aplicación-rol |
| `/usuario-rol-api` | usuario-rol | 8009 | Consultar asignaciones usuario-rol (runtime) |

### API del middleware (`/api/v1/apps/*`)

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/v1/apps` | POST | Crear aplicación |
| `/api/v1/apps` | GET | Listar aplicaciones |
| `/api/v1/apps/{id}` | GET | Obtener aplicación con roles |
| `/api/v1/apps/{id}` | PUT | Actualizar aplicación |
| `/api/v1/apps/{id}` | DELETE | Baja lógica |
| `/api/v1/apps/{id}/roles` | GET/POST | Gestión de roles |
| `/api/v1/apps/{id}/roles/{rc_id}` | DELETE | Remover rol |
| `/api/v1/apps/{id}/roles/{rc_id}/modules` | GET/PUT | Módulos por rol |
| `/api/v1/apps/{id}/menu` | GET/PUT | Menú personalizado |
| `/api/v1/apps/{id}/menu/auto-generate` | POST | Auto-generar menú |
| `/api/v1/apps/{id}/runtime/{role_id}` | GET | Config runtime (público) |
| `/api/v1/apps/by-slug/{slug}` | GET | Buscar app por slug |

### Modelo de datos (middleware DB)

- **app_definitions**: id, id_aplicacion, nombre, descripcion, slug (unique), is_active, baja_logica, created_at, updated_at.
- **app_role_configs**: id, app_definition_id (FK), id_role, role_nombre, is_active.
- **app_role_modules**: id, app_role_config_id (FK), backend_service_id, endpoint_path, metodo, is_enabled.
- **app_menu_configs**: id, app_definition_id (FK, unique), menu_structure (JSON).

### Microfrontend App Runtime

- Puerto: 4201 (desarrollo) / 80 (Docker).
- Ruta: `/:slug` (ej: `/mi-app-admin`).
- Flujo: Login → resolución de rol del usuario → carga de configuración runtime → sidebar dinámico con menú personalizado → visor de módulos.

### Despliegue

El `docker-compose.yml` incluye el servicio `app-runtime` en puerto 4201.

---

## Referencias

- [documentacion/PRD.md](../documentacion/PRD.md) — PRD completo.
- [auth.md](auth.md) — Autenticación en el middleware (Basic y preparado para Keycloak).
