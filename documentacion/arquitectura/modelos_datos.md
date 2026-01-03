# Modelos de Datos y Entidad Relación

## 1. Base de Datos de Microservicios (Individuales)

Cada microservicio (`pais`, `provincia`, `localidad`, `corporacion`) utiliza una base de datos **SQLite** independiente con una estructura normalizada de auditoría y baja lógica.

### Estructura General de Entidades
```mermaid
erDiagram
    PAIS {
        string id PK
        string descripcion
        string sigla_pais
        boolean baja_logica
        datetime fecha_alta_creacion
        datetime fecha_alta_modificacion
    }
    PROVINCIA {
        string id PK
        string descripcion
        string id_pais FK
        boolean baja_logica
        datetime fecha_alta_creacion
        datetime fecha_alta_modificacion
    }
    LOCALIDAD {
        string id PK
        string descripcion
        string id_pais FK
        string id_provincia FK
        boolean baja_logica
        datetime fecha_alta_creacion
        datetime fecha_alta_modificacion
    }
    CORPORACION {
        string id PK
        string descripcion
        boolean baja_logica
        datetime fecha_alta_creacion
        datetime fecha_alta_modificacion
    }
    EMPRESA {
        string id PK
        string descripcion
        string id_corporacion FK
        boolean baja_logica
        datetime fecha_alta_creacion
        datetime fecha_alta_modificacion
    }
```

## 2. Base de Datos del Middleware (`middleware_config.db`)

Centraliza la configuración del ecosistema.

```mermaid
erDiagram
    BACKEND_SERVICE ||--o{ BACKEND_MAPPING : "tiene"
    FRONTEND_SERVICE ||--o{ BACKEND_MAPPING : "consume"

    BACKEND_SERVICE {
        string id PK
        string nombre
        string host
        int puerto
        string openapi_url
        string swagger_hash
        json swagger_spec_cached
        boolean is_active
    }

    FRONTEND_SERVICE {
        string id PK
        string nombre
        boolean is_active
    }

    BACKEND_MAPPING {
        int id PK
        string frontend_service_id FK
        string backend_service_id FK
        string endpoint_path
        string metodo
        json configuracion_ui
    }
```

### Detalle de `configuracion_ui` (JSON)
El campo `configuracion_ui` en `backend_mappings` es el más importante, ya que contiene:
- `label`: Nombre legible del endpoint.
- `fields_config`: Diccionario donde las keys son los atributos técnicos y los valores contienen:
    - `visualName`: Label a mostrar en la UI.
    - `show`: Booleano de visibilidad.
    - `order`: Posición en la pantalla.
    - `refService`: (Opcional) Microservicio para búsqueda/combo.
    - `dependsOn`: (Opcional) Campo del que depende este filtro.
