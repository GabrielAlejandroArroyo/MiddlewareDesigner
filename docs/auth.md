# Autenticación en el Middleware

El middleware expone un sistema de login configurable: **Basic Auth** (variables de entorno), **Database Auth** (contra servicio Usuario) y preparado para **Keycloak** (OIDC) en el futuro.

## Rutas protegidas y públicas

| Ruta | Autenticación |
|------|----------------|
| `GET /` | Pública (health/welcome) |
| `GET /docs`, `GET /openapi.json` | Públicas |
| `POST /api/v1/auth/login` | Pública (login con usuario/contraseña) |
| `/api/v1/config/*` | Requieren autenticación (Basic o Bearer según configuración) |

## Configuración por entorno

El **usuario y la contraseña** se configuran en un archivo **`.env`** en la carpeta del middleware (`middleware/`). No se deben hardcodear secretos.

1. Copiar `middleware/.env.example` a `middleware/.env`.
2. Editar `.env` y asignar los valores deseados para `MIDDLEWARE_AUTH_USER` y `MIDDLEWARE_AUTH_PASSWORD`.
3. El middleware lee las variables al arrancar (ejecutar desde la carpeta `middleware/` para que encuentre el `.env`).

### Variables

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `AUTH_TYPE` | `none`, `basic`, `database` o `oidc` | `basic` |
| `USUARIO_SERVICE_URL` | URL del servicio Usuario (puerto 8007). Solo cuando `AUTH_TYPE=database` | `http://127.0.0.1:8007` |
| `MIDDLEWARE_AUTH_USER` | Usuario para Basic Auth | `admin` |
| `MIDDLEWARE_AUTH_PASSWORD` | Contraseña para Basic Auth | `admin` |
| `SESSION_TIMEOUT_MINUTES` | Tiempo de sesión en minutos (desconexión automática tras X minutos desde el login) | `3` |
| `SESSION_INACTIVITY_MINUTES` | Tiempo de inactividad en minutos (logout automático si no hay interacción; 0 = deshabilitado) | `15` |
| `OIDC_ISSUER_URL` | URL del issuer (Keycloak) | — |
| `OIDC_AUDIENCE` | Audience del JWT | — |
| `OIDC_CLIENT_ID` | Client ID (Keycloak) | — |
| `OIDC_CLIENT_SECRET` | Client secret (solo si se usa introspect) | — |

- **`AUTH_TYPE=none`**: Las rutas de config no exigen credenciales (usuario anónimo).
- **`AUTH_TYPE=basic`**: Se exige header `Authorization: Basic <base64(user:password)>`. Las credenciales se validan contra `MIDDLEWARE_AUTH_USER` y `MIDDLEWARE_AUTH_PASSWORD`.
- **`AUTH_TYPE=database`**: Las credenciales se validan contra el **servicio Usuario** (POST `/api/v1/auth/validate`). El usuario admin por defecto se crea con el script de seeds. Las contraseñas se almacenan hasheadas (bcrypt).
- **`AUTH_TYPE=oidc`**: (Futuro) Se exige `Authorization: Bearer <JWT>`. El token se valida contra el issuer (JWKS o introspect).

## Flujo de login (actual)

1. El usuario abre el Designer UI (microfrontend). Si no está logueado, el **AuthGuard** redirige a `/login`.
2. Si una petición al middleware devuelve **401**, el frontend redirige a la pantalla de login (`/login`).
3. El usuario introduce usuario y contraseña y envía el formulario.
4. El frontend llama a `POST /api/v1/auth/login` con `{username, password}`.
5. Si la respuesta es **200**, se considera “logueado” y se redirige al panel principal. Las credenciales se persisten en localStorage con TTL configurable (`session_timeout_minutes` devuelto por el login; se configura en `.env` con `SESSION_TIMEOUT_MINUTES`).
6. Si requires_password_change: true, se redirige a /cambiar-password; si no, al panel principal.
7. Todas las peticiones posteriores incluyen el header Authorization Basic (inyectado por un interceptor HTTP).
8. Tras el tiempo configurado sin revalidación, la sesión expira y se requiere volver a autenticarse.

### Timeout por inactividad

Si `SESSION_INACTIVITY_MINUTES` > 0, el frontend detecta la inactividad del usuario (sin mouse, teclado, scroll o touch) durante ese tiempo. Tras alcanzar el límite, se muestra un modal informativo (“Sesión expirada por inactividad”) y se redirige al login. Ambos mecanismos conviven: la sesión expira por tiempo máximo (`SESSION_TIMEOUT_MINUTES`) o por inactividad (el que ocurra primero).

## Flujo futuro con Keycloak (OIDC)

1. El usuario será redirigido al IAM (Keycloak) para iniciar sesión.
2. Tras el login, el frontend recibirá un **access_token** (JWT).
3. El interceptor enviará `Authorization: Bearer <access_token>` en cada petición al middleware.
4. El middleware validará el JWT (firma con JWKS del issuer o endpoint de introspect) y extraerá el usuario (p. ej. `sub`, `preferred_username`) en un `UserInfo` común.

## Implementación en el middleware

- **Módulo** `middleware/auth/`: configuración (`auth_config.py`), interfaz `AuthProvider` (`auth_provider.py`), implementaciones `BasicAuthProvider` y `DatabaseAuthProvider` (`database_auth.py`), y dependencia FastAPI `get_current_user` (`dependencies.py`).
- **Proveedores**: `BasicAuthProvider` (contra variables de entorno), `DatabaseAuthProvider` (contra servicio Usuario) y, en el futuro, `OIDCProvider` que valide JWT con JWKS/introspect y mapee claims a `UserInfo`.
- La dependencia `get_current_user` se aplica al router `/api/v1/config`; `GET /` y `POST /api/v1/auth/login` quedan sin protección.

## Seeds y usuario admin

El script `scripts/seed_initial_data.py` crea los datos iniciales: Aplicación MIDDLEWARE, Rol Administrador, Usuario admin (password inicial `admin`, debe cambiarse en el primer login). Se ejecuta automáticamente desde `start_all.ps1` tras esperar a los 5 microservicios (Aplicación, Roles, Usuario, Aplicacion-Role, Usuario-Rol). Si se ejecuta manualmente, el script verifica que estén disponibles antes de crear los seeds: `python scripts/seed_initial_data.py`.

## OpenAPI (Swagger)

El esquema OpenAPI del middleware declara el security scheme **BasicAuth** para las rutas bajo `/api/v1/config`, de modo que en Swagger UI se pueda probar con usuario y contraseña.
