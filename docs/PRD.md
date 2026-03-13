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
2. **Asignar roles** disponibles: se cargan **únicamente los roles pertenecientes a la aplicación vinculada** usando `GET /roles/aplicacion/{id_aplicacion}` del servicio `roles` (8006). Si la app no está vinculada, no se muestran roles y se indica al usuario que debe vincular desde la pestaña Información. Cada rol muestra: descripción, ID, aplicación asociada, fecha de creación, estado (activo/baja) y cantidad de usuarios vinculados. Al asignar un rol, se sincroniza con el servicio `aplicacion-role` (8008).
3. **Configurar módulos por rol**: seleccionar qué endpoints habilitados de cada backend service son accesibles por cada rol.
4. **Diseñar el menú**: auto-generado desde los módulos seleccionados, con opción de personalización manual (etiquetas, iconos, jerarquía). La pestaña Menú incluye **Previsualización en vivo**: el mismo panel que en `/preview` (Módulos Generados, microservicios y botón "Probar funcionalidad") para ver y probar los endpoints mientras se configura la estructura del menú.
5. **URL de acceso**: muestra la URL del runtime donde los usuarios finales acceden a la aplicación. Incluye un botón **"Diagnosticar"** que verifica el estado de configuración (app activa, roles, módulos, menú, accesibilidad del runtime) y un botón **"Abrir Aplicación"** que realiza esta verificación antes de redirigir, mostrando problemas detectados si la app no está lista.

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
| `/api/v1/apps/{id}/check-access` | GET | Diagnóstico de accesibilidad (auth) |
| `/api/v1/apps/{id}/runtime/{role_id}` | GET | Config runtime (público) |
| `/api/v1/apps/available` | GET | Listar apps activas (público, usado por app-runtime home) |
| `/api/v1/apps/by-slug/{slug}` | GET | Buscar app por slug |
| `/api/v1/runtime/proxy/{service_id}/{path}` | GET/POST/PUT/PATCH/DELETE | Proxy a backends (evita CORS; app-runtime) |

### Modelo de datos (middleware DB)

- **app_definitions**: id, id_aplicacion, nombre, descripcion, slug (unique), is_active, baja_logica, created_at, updated_at.
- **app_role_configs**: id, app_definition_id (FK), id_role, role_nombre, is_active.
- **app_role_modules**: id, app_role_config_id (FK), backend_service_id, endpoint_path, metodo, is_enabled.
- **app_menu_configs**: id, app_definition_id (FK, unique), menu_structure (JSON).

### Microfrontend App Runtime

- Puerto: 4201 (desarrollo) / 80 (Docker).
- **Rutas del SPA**:
  - `/login` — Pantalla de login (pública).
  - `/apps` — Home: listado de todas las aplicaciones configuradas (requiere auth). Muestra tarjetas con nombre, slug, descripción, roles y un enlace directo a cada app.
  - `/:slug` — Shell de la aplicación específica (requiere auth). Carga la configuración runtime según el rol del usuario.
  - `/` y `/**` — Redirigen a `/apps`.
- **Flujo de navegación**: Login → `/apps` (listado de aplicaciones) → clic en app → `/:slug` (shell con sidebar y módulos). Desde el shell se puede volver al listado con "Todas las Aplicaciones".
- **Interacción del menú**: Al cargar la app se auto-selecciona el primer módulo GET y se muestra la grilla. Los ítems padre se expanden por defecto. Al hacer clic en cualquier opción del menú (ej. "Listar todos los paises") se selecciona el módulo correspondiente. El proxy `/api/v1/runtime/proxy/{service_id}/{path}` evita CORS al llamar a backends.
- El **guard de autenticación** preserva la URL de retorno (`returnUrl`), de modo que al hacer login desde una URL directa (ej: `/base`) se redirige automáticamente a esa app.
- **Página de error descriptiva**: cuando la app no puede cargarse, se muestra una página de error con: código de error, título, descripción detallada, detalles técnicos (estado de la app, roles, módulos, menú), sugerencia de resolución, timestamp y slug. Los códigos de error incluyen: `APP_NOT_FOUND`, `APP_INACTIVE`, `APP_DELETED`, `NO_ROLES`, `NO_USER_ROLE`, `NO_MODULES`, `NO_MENU`, `RUNTIME_ERROR`.

### Despliegue

El `docker-compose.yml` incluye el servicio `app-runtime` en puerto 4201.

---

## Asistente IA (Ayuda Contextual)

### Descripción

El sistema incluye un asistente de ayuda integrado basado en **Ollama** (IA open source, gratuita, sin API keys). Aparece como un botón flotante (FAB) en la esquina inferior derecha del Designer UI.

### Características

- **Botón flotante**: Icono de robot (bi-robot) siempre visible cuando el usuario está logueado.
- **Chat panel**: Panel emergente con historial de mensajes, streaming de respuestas y sugerencias rápidas.
- **Contexto automático**: Detecta en qué pantalla está el usuario y envía el contexto relevante al modelo de IA.
- **Streaming**: Las respuestas se muestran token a token en tiempo real.
- **Sin API keys**: Usa Ollama corriendo localmente (puerto 11434 por defecto).
- **Modelo configurable**: Por defecto `llama3.2`, configurable vía `OLLAMA_MODEL` en el `.env` del middleware.

### Arquitectura

1. El frontend (`AiHelpComponent`) envía la pregunta + contexto de la página al middleware.
2. El middleware (`/api/v1/ai-help/chat`) construye un prompt con un system prompt específico del proyecto y lo envía a Ollama.
3. Ollama procesa con el modelo local y devuelve la respuesta en streaming.
4. El frontend muestra los tokens a medida que llegan.

### API del middleware

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/v1/ai-help/status` | GET | Verificar disponibilidad de Ollama y modelos instalados |
| `/api/v1/ai-help/chat` | POST | Enviar pregunta con contexto y recibir respuesta en streaming |

### Requisitos

- Instalar [Ollama](https://ollama.com) en la máquina donde corre el middleware.
- Descargar un modelo: `ollama pull llama3.2`.
- Configurar en `middleware/.env`: `OLLAMA_BASE_URL` y `OLLAMA_MODEL`.

---

## Referencias

- [documentacion/PRD.md](../documentacion/PRD.md) — PRD completo.
- [auth.md](auth.md) — Autenticación en el middleware (Basic y preparado para Keycloak).
