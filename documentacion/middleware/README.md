# Middleware Designer - Orquestador

El Middleware es el corazón del sistema. Actúa como un servidor proxy inteligente que gestiona los metadatos de los servicios backend.

## Tecnologías
- **Framework**: FastAPI
- **Base de Datos**: SQLite (configuración)
- **ORM**: SQLAlchemy 2.0 (Async)
- **Parser**: httpx para lectura de contratos remotos.

## Endpoints Clave

### Gestión de Servicios (`/api/v1/config/backend-services`)
- `POST /`: Registra un nuevo microservicio.
- `GET /`: Lista servicios activos y verifica cambios en sus Swagger (comparando hashes).
- `GET /{id}/inspect`: Realiza el análisis profundo del contrato y devuelve endpoints + DTOs estructurados.
- `POST /{id}/refresh-swagger`: Fuerza la limpieza de caché y re-análisis del contrato.

### Gestión de Mapeos (`/api/v1/config/mappings`)
- `POST /toggle`: Habilita/Deshabilita un endpoint para la UI y guarda su configuración de labels y orden.
- `DELETE /`: Elimina un mapeo existente.

## Lógica de Resolución de DTOs
El servicio `OpenApiService` es responsable de:
1. Resolver referencias `$ref` de forma recursiva.
2. Identificar tipos de datos (string, integer, boolean, date-time).
3. Detectar estructuras de colecciones (arrays) y extraer sus modelos internos.
4. Normalizar los nombres de los tipos para la visualización en el frontend (ej: `PaisReadDTO[]`).
