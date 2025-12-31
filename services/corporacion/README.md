# Microservicio de Corporación

Microservicio para la gestión de corporaciones desarrollado con FastAPI.

## Características

- **ID**: Autoincremental
- **Nombre**: Nombre de la corporación (Único)
- **Razón Social**: Razón social legal
- **CUIT**: Identificador fiscal (Único)
- **Dirección**: Ubicación física
- **Teléfono**: Contacto telefónico
- **Email**: Correo electrónico de contacto
- **Activo**: Estado operativo de la corporación

## Estructura del Proyecto

```
corporacion/
├── main.py                 # Aplicación FastAPI principal
├── config/
│   └── database.py         # Configuración de base de datos
├── routers/
│   └── corporacion_routes.py # Endpoints del microservicio
├── entity/
│   └── corporacion_model.py  # Entidad de dominio
├── dto/
│   ├── corporacion_base_dto.py   # Validaciones base
│   ├── corporacion_create_dto.py # DTO para creación (POST)
│   ├── corporacion_read_dto.py   # DTO para lectura (GET)
│   ├── corporacion_update_dto.py # DTO para actualización (PATCH/PUT)
│   └── corporacion_delete_dto.py # DTO para respuesta de eliminación
├── services/
│   └── corporacion_service.py    # Lógica de negocio
└── requirements.txt       # Dependencias
```

## Ejecución

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8004
```

## Endpoints

### GET `/api/v1/corporaciones/`
Obtiene la lista de todas las corporaciones.

### GET `/api/v1/corporaciones/{corporacion_id}`
Obtiene una corporación por su ID.

### POST `/api/v1/corporaciones/`
Crea una nueva corporación.

### PUT `/api/v1/corporaciones/{corporacion_id}`
Actualiza una corporación existente.

### DELETE `/api/v1/corporaciones/{corporacion_id}`
Elimina una corporación físicamente.

## Documentación

Una vez ejecutado el servicio, la documentación interactiva estará disponible en:
- Swagger UI: `http://localhost:8004/docs`
```
