# Microservicio de País

Microservicio para la gestión de países desarrollado con FastAPI.

## Características

- **ID**: Alfanumérico (puede contener guiones y guiones bajos)
- **Descripción**: Nombre o descripción del país
- **Sigla País**: Código de 2-3 caracteres alfabéticos
- **Baja Lógica**: Campo booleano que indica si el país está dado de baja lógicamente
- **Fecha Alta Creación**: Fecha y hora de creación (se genera automáticamente)
- **Fecha Alta Modificación**: Fecha y hora de última modificación (se actualiza automáticamente)

## Estructura del Proyecto

```
pais/
├── main.py                 # Aplicación FastAPI principal
├── routers/
│   └── pais_routes.py     # Endpoints del microservicio
├── entity/
│   └── pais_entity.py     # Entidad de dominio
├── dto/
│   ├── pais_base_dto.py   # Validaciones base
│   ├── pais_create_dto.py # DTO para creación (POST)
│   ├── pais_read_dto.py   # DTO para lectura (GET)
│   ├── pais_put_dto.py    # DTO para actualización completa (PUT)
│   ├── pais_update_dto.py # DTO para actualización parcial (PATCH)
│   └── pais_delete_dto.py # DTO para respuesta de eliminación
├── services/
│   └── pais_service.py    # Lógica de negocio (mapeo Entity <-> DTO)
└── requirements.txt       # Dependencias
```

## Instalación

```bash
pip install -r requirements.txt
```

## Ejecución

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

### GET `/api/v1/paises/`
Obtiene la lista de todos los países.

**Query Parameters:**
- `include_baja_logica` (bool, default: `true`): Si es `false`, excluye los países dados de baja lógicamente.

### GET `/api/v1/paises/{pais_id}`
Obtiene un país por su ID.

### POST `/api/v1/paises/`
Crea un nuevo país.

**Body:**
```json
{
  "id": "ARG",
  "descripcion": "Argentina",
  "sigla_pais": "AR"
}
```

### PUT `/api/v1/paises/{pais_id}`
Actualiza un país existente.

**Body:**
```json
{
  "descripcion": "República Argentina",
  "sigla_pais": "ARG",
  "baja_logica": false
}
```

**Nota:** Todos los campos son opcionales. La fecha de modificación se actualiza automáticamente.

### PATCH `/api/v1/paises/{pais_id}/baja-logica`
Realiza una baja lógica de un país (marca el país como dado de baja sin eliminarlo físicamente).

### PATCH `/api/v1/paises/{pais_id}/alta-logica`
Realiza un alta lógica de un país (revierte la baja lógica).

### DELETE `/api/v1/paises/{pais_id}`
Elimina un país físicamente por su ID (eliminación permanente).

## Documentación

Una vez ejecutado el servicio, la documentación interactiva estará disponible en:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`


