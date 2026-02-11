# Autenticación en el Middleware

El middleware expone un sistema de login configurable: **Basic Auth** por defecto y preparado para conectar un IAM como **Keycloak** (OIDC) en el futuro.

## Rutas protegidas y públicas

| Ruta | Autenticación |
|------|----------------|
| `GET /` | Pública (health/welcome) |
| `GET /docs`, `GET /openapi.json` | Públicas |
| `/api/v1/config/*` | Requieren autenticación (Basic o Bearer según configuración) |

## Configuración por entorno

El **usuario y la contraseña** se configuran en un archivo **`.env`** en la carpeta del middleware (`middleware/`). No se deben hardcodear secretos.

1. Copiar `middleware/.env.example` a `middleware/.env`.
2. Editar `.env` y asignar los valores deseados para `MIDDLEWARE_AUTH_USER` y `MIDDLEWARE_AUTH_PASSWORD`.
3. El middleware lee las variables al arrancar (ejecutar desde la carpeta `middleware/` para que encuentre el `.env`).

### Variables

| Variable | Descripción | Por defecto |
|----------|-------------|-------------|
| `AUTH_TYPE` | `none`, `basic` o `oidc` | `basic` |
| `MIDDLEWARE_AUTH_USER` | Usuario para Basic Auth | `admin` |
| `MIDDLEWARE_AUTH_PASSWORD` | Contraseña para Basic Auth | `admin` |
| `OIDC_ISSUER_URL` | URL del issuer (Keycloak) | — |
| `OIDC_AUDIENCE` | Audience del JWT | — |
| `OIDC_CLIENT_ID` | Client ID (Keycloak) | — |
| `OIDC_CLIENT_SECRET` | Client secret (solo si se usa introspect) | — |

- **`AUTH_TYPE=none`**: Las rutas de config no exigen credenciales (usuario anónimo).
- **`AUTH_TYPE=basic`**: Se exige header `Authorization: Basic <base64(user:password)>`. Las credenciales se validan contra `MIDDLEWARE_AUTH_USER` y `MIDDLEWARE_AUTH_PASSWORD`.
- **`AUTH_TYPE=oidc`**: (Futuro) Se exige `Authorization: Bearer <JWT>`. El token se valida contra el issuer (JWKS o introspect).

## Flujo Basic Auth (actual)

1. El usuario abre el Designer UI (microfrontend).
2. Si una petición al middleware devuelve **401**, el frontend redirige a la pantalla de login (`/login`).
3. El usuario introduce usuario y contraseña y envía el formulario.
4. El frontend guarda las credenciales **en memoria** y realiza una petición de prueba (p. ej. `GET /api/v1/config/backend-services`) con header `Authorization: Basic ...`.
5. Si la respuesta es **200**, se considera “logueado” y se redirige al panel principal.
6. Todas las peticiones posteriores al middleware incluyen el header `Authorization` (inyectado por un interceptor HTTP).

## Flujo futuro con Keycloak (OIDC)

1. El usuario será redirigido al IAM (Keycloak) para iniciar sesión.
2. Tras el login, el frontend recibirá un **access_token** (JWT).
3. El interceptor enviará `Authorization: Bearer <access_token>` en cada petición al middleware.
4. El middleware validará el JWT (firma con JWKS del issuer o endpoint de introspect) y extraerá el usuario (p. ej. `sub`, `preferred_username`) en un `UserInfo` común.

## Implementación en el middleware

- **Módulo** `middleware/auth/`: configuración (`auth_config.py`), interfaz `AuthProvider` (`auth_provider.py`), implementación Basic (`basic_auth.py`) y dependencia FastAPI `get_current_user` (`dependencies.py`).
- **Proveedores**: `BasicAuthProvider` (actual) y, en el futuro, `OIDCProvider` que valide JWT con JWKS/introspect y mapee claims a `UserInfo`.
- La dependencia `get_current_user` se aplica al router `/api/v1/config`; `GET /` queda sin protección para health checks y balanceadores.

## OpenAPI (Swagger)

El esquema OpenAPI del middleware declara el security scheme **BasicAuth** para las rutas bajo `/api/v1/config`, de modo que en Swagger UI se pueda probar con usuario y contraseña.
