# Middleware Designer - Orquestador Inteligente

El Middleware actúa como un proxy de metadatos y orquestador del ecosistema, transformando contratos técnicos crudos en definiciones amigables para el usuario.

## Tecnologías y Seguridad
- **Framework**: FastAPI (Asíncrono).
- **Resolución de Modelos**: Motor personalizado de recursividad para esquemas OpenAPI 3.1.
- **Sanitización**: Procesamiento de strings para eliminar ruidos de codificación (No-ASCII).

## Lógica de Resolución de DTOs (Resiliencia)
El servicio `OpenApiService` implementa un motor de resolución de esquemas avanzado:

1.  **Aplanamiento de Herencia (`allOf`)**: Pydantic utiliza `allOf` para la herencia de clases. El middleware fusiona recursivamente las propiedades de todas las ramas, garantizando que campos como `id` o `descripcion` de las clases base siempre estén presentes en el DTO final.
2.  **Manejo de Opcionales (`anyOf` / `oneOf`)**: Detecta automáticamente el tipo principal en uniones (como `String | null`) para presentar el tipo de dato correcto al diseñador.
3.  **Recursividad Segura**: Soporta modelos anidados y arrays de objetos con un límite de profundidad de 20 niveles para evitar ciclos infinitos.
4.  **Limpieza de Metadatos**: Todos los títulos (`title`) y descripciones (`description`) son limpiados de caracteres especiales que podrían romper el renderizado en el navegador.

## Gestión de Caché y Estado
- **Invalidez de Caché**: Implementa una política de limpieza total (`UPDATE backend_services SET swagger_spec_cached = NULL`) para forzar re-inspecciones ante errores críticos.
- **Hash de Integridad**: Compara el hash del Swagger remoto contra la versión local para alertar sobre cambios pendientes de aplicar.

## Endpoints de Configuración
- `GET /inspect`: Devuelve la estructura plana de todos los endpoints, diferenciando entre DTOs de Request y Response.
- `POST /refresh-swagger`: Descarta la copia local y realiza una nueva inspección profunda del microservicio.

## Despliegue con Docker

El proyecto incluye un `Dockerfile` para ejecutar el middleware en contenedor:

```bash
cd middleware
docker build -t middleware-designer .
docker run -p 9000:9000 middleware-designer
```

**Con variables de entorno** (ejemplo con auth básica):

```bash
docker run -p 9000:9000 \
  -e AUTH_TYPE=basic \
  -e MIDDLEWARE_AUTH_USER=admin \
  -e MIDDLEWARE_AUTH_PASSWORD=admin \
  middleware-designer
```

**Persistencia de la base SQLite** (volumen nombrado):

```bash
docker run -p 9000:9000 -v middleware_db:/app middleware-designer
```

### Docker Compose (Middleware + Usuario + Designer UI + init)

En la raíz del monorepo existe un `docker-compose.yml` que levanta Middleware, servicio Usuario, Designer UI (microfrontend Angular) y script de init que crea el usuario admin automáticamente:

```bash
# Desde la raíz del repositorio
docker compose up -d
```

Tras ~10-15 segundos:
- **Designer UI**: http://localhost:4200
- **Middleware**: http://localhost:9000
- **Usuario**: http://localhost:8007
- **Login**: usuario `admin`, contraseña `admin` (requiere cambio al primer acceso)

El frontend hace proxy de `/api` al middleware y `/usuario-api` al servicio Usuario. El servicio `usuario-init` crea el usuario admin al primer arranque si no existe. Es idempotente.

**Reinicio limpio (borrar volúmenes y empezar de cero):**

```powershell
.\scripts\clean_and_start.ps1
```

**Reset completo (limpiar todo: contenedores, volúmenes, imágenes, redes, cache y recrear):**

```powershell
.\scripts\reset_docker_complete.ps1
```

Elimina contenedores, volúmenes, imágenes y redes del proyecto, limpia el build cache, reconstruye todas las imágenes sin cache y levanta todo. Útil cuando hay corrupción o cambios de configuración que requieren partir de cero.

**Regla aplicada al arrancar:** Usuarios con `password_hash` null reciben contraseña "1234" y deben cambiarla en el primer login. Admin se crea con admin/admin (también con cambio obligatorio). El script verifica que el login funcione tras el arranque.

**Registrar backends en Docker:**

Con `LOCALHOST_SERVICE_MAP` (en docker-compose: `8007:usuario`), el middleware reescribe URLs con `localhost` o `127.0.0.1` al hostname del servicio en la red Docker. En Gestión de Microservicios puedes usar:
- `http://localhost:8007/openapi.json` o
- `http://127.0.0.1:8007/openapi.json`

y el middleware las tratará como `http://usuario:8007/openapi.json`. El panel de control comprueba el estado online/offline a través del middleware (no desde el navegador), por lo que los servicios registrados deberían aparecer como ONLINE cuando estén activos.

Ver `middleware/.env.example` para las variables de entorno disponibles.
