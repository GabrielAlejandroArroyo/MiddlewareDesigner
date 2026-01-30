# Product Requirements Document (PRD) — Middleware Designer

## 1. Descripción del producto y visión

### Qué es
Middleware Designer es un ecosistema para **diseñar interfaces dinámicas** a partir de los contratos **OpenAPI** de microservicios. El sistema permite registrar backends, inspeccionar sus contratos, configurar qué endpoints y DTOs se exponen y cómo se muestran en la UI, y generar formularios y grillas desde metadatos.

### Valor
- **Middleware**: Orquesta los contratos OpenAPI, aplana herencia de DTOs (`allOf`/`anyOf`) y permite configurar qué endpoints se habilitan y con qué etiquetas, orden y visibilidad de campos.
- **Frontend**: Genera formularios y grillas en tiempo real según la configuración guardada en el middleware, con blindaje ante metadatos incompletos.

### Estado
- **Operativo y estable**.
- **Backend**: Python (FastAPI) + SQLAlchemy 2.0.
- **Middleware**: Motor de resolución resiliente de OpenAPI (FastAPI).
- **Frontend**: Angular 17+ (diseño basado en metadatos).

---

## 2. Usuarios y roles

| Rol | Descripción |
|-----|-------------|
| **Administrador del ecosistema** | Registra backends (URL OpenAPI), inspecciona contratos, define acciones (labels, orden, visibilidad de atributos), refresca caché Swagger y monitorea el estado de salud de los microservicios. |
| **Usuario final** | Consume las UIs generadas (preview, formularios y grillas según la configuración definida por el administrador). |

---

## 3. Funcionalidades por capa

### 3.1 Backend (microservicios en `services/`)

- **Catálogo actual**: País (8000), Provincia (8001), Localidad (8002), Corporación (8003), Empresa (8004), Aplicación (8005), Roles (8006), Usuario (8007), Aplicación-Role, Usuario-Rol, etc.
- **Responsabilidades**: Cada microservicio expone CRUD, contrato OpenAPI en `/openapi.json` (o equivalente), DTOs estándar (Read, Create, Update, Put, Delete) y entidades con auditoría y baja lógica.
- **Convenciones**: Patrón RORO para listados (objeto con `entidad` y `total`); rutas versionadas `/api/v1/<recurso>/`.
- **Detalle**: Ver [Catálogo de Servicios](servicios/catalogo.md).

### 3.2 Middleware (`middleware/`)

- **Registro y listado** de backend services: `POST` / `GET` `/api/v1/config/backend-services`.
- **Inspección de contrato** por servicio: `GET .../backend-services/{id}/inspect` — devuelve endpoints con DTOs de request/response aplanados y estado de habilitación.
- **Mapeos endpoint ↔ frontend**: Habilitar/deshabilitar endpoints; configuración UI por endpoint: `label`, `fields_config` (visualName, show, order, refService, dependsOn).
- **Refresh de Swagger**: Actualizar contrato cacheado con opción de conservar configuración; detección de cambios por hash.
- **Baja lógica y reactivación** de servicios.
- **Detalle**: Ver [Middleware Designer](middleware/README.md).

### 3.3 Frontend Designer UI (`microfrontends/designer-ui/`)

| Pantalla | Ruta | Descripción |
|----------|------|-------------|
| **Dashboard** | `/` | Heartbeat y estado de salud de los microservicios; acceso rápido a inspección por servicio. |
| **Gestión de microservicios** | `/backends` | Alta de backends (URL OpenAPI), listado, eliminación (lógica/física), reactivación, listado de mapeos por servicio con indicador de cambios en Swagger. |
| **Inspección de contrato** | `/inspect/:id` | Listado de endpoints del servicio; habilitar/deshabilitar para el frontend; navegación a definición de acción. |
| **Definición de acción** | `/inspect/:id/action-definition?path=&method=` | Configuración por endpoint (Request/Response): labels, orden drag-and-drop, visibilidad; botón "Limpiar caché Swagger"; guardado de configuración en el middleware. |
| **Preview** | `/preview` | Prueba de endpoints (selección de servicio y endpoint); formularios y grillas en tiempo real según configuración. |
| **Custom Page Designer** | `/custom-designer` | Diseño de menú/estructura con ítems que apuntan a servicios y endpoints. |

**Detalle**: Ver [Microfrontend Designer UI](frontend/README.md).

---

## 4. Flujos de usuario principales

1. **Registro de un nuevo microservicio**  
   Dashboard o Backends → Agregar URL OpenAPI → Middleware valida y cachea contrato → El servicio aparece en listado e inspección.

2. **Configurar cómo se muestra un endpoint**  
   Inspección → elegir endpoint → Action Definition → editar labels/orden/visibilidad Request/Response → Guardar → Preview para validar.

3. **Detectar cambios en el contrato**  
   Listado de backends con verificación de cambios (o en inspección: `has_changes`) → Refresh Swagger (opción conservar configuración) → Revisar mapeos obsoletos o deprecados.

---

## 5. API (resumen)

### Middleware (base: `http://127.0.0.1:9000/api/v1/config`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/backend-services` | Registrar o actualizar un backend (URL OpenAPI). |
| GET | `/backend-services` | Listar backends (opcional: `include_deleted`, `check_changes`). |
| GET | `/backend-services/{service_id}/inspect` | Inspección: endpoints y DTOs aplanados. |
| GET | `/backend-services/{service_id}/mappings` | Mapeos del servicio (con indicador de cambios). |
| GET | `/backend-services/{service_id}/check-changes` | Verificar si hay cambios en Swagger sin aplicar. |
| POST | `/backend-services/{service_id}/refresh-swagger` | Refrescar Swagger (opcional: `preserve_config`). |
| DELETE | `/backend-services/{service_id}` | Eliminar backend (lógica o física con `physical=true`). |
| PATCH | `/backend-services/{service_id}/alta-logica` | Reactivar backend en baja lógica. |
| POST | `/mappings/toggle` | Habilitar o actualizar mapeo de endpoint. |
| DELETE | `/mappings` | Deshabilitar mapeo (query: backend_service_id, endpoint_path, metodo, frontend_service_id). |

### Microservicios

- Convención de rutas: `/api/v1/<recurso>/`.
- Puertos típicos: 8000–8007+ (ver [Catálogo de Servicios](servicios/catalogo.md)).

---

## 6. Modelo de datos (resumen)

### Por microservicio
- Entidades con `id`, `descripción`, `baja_logica`, `fecha_alta_creacion`, `fecha_alta_modificacion`; relaciones según dominio (ej. Provincia → País, Localidad → Provincia/País).
- Detalle: [Modelos de Datos](arquitectura/modelos_datos.md).

### Middleware (`middleware_config.db`)
- **backend_services**: id, nombre, host, puerto, openapi_url, swagger_hash, swagger_spec_cached, is_active, baja_logica, etc.
- **frontend_services**: id, nombre, is_active.
- **backend_mappings**: id, frontend_service_id, backend_service_id, endpoint_path, metodo, configuracion_ui (JSON con label, fields_config: visualName, show, order, refService, dependsOn).
- Detalle: [Modelos de Datos](arquitectura/modelos_datos.md).

---

## 7. Requisitos no funcionales y criterios de éxito

- **OpenAPI como fuente de verdad**: Cualquier cambio de API debe reflejarse primero en el contrato OpenAPI; luego se valida compatibilidad y se actualiza middleware/UI.
- **Resiliencia**: Aplanamiento de herencia y opcionales en DTOs; sanitización de metadatos (caracteres no ASCII); fallbacks en UI ante datos de contrato incompletos.
- **Monitoreo**: Heartbeat desde el frontend a cada microservicio; los servicios deben exponer CORS y endpoints de estado para el panel de control.

---

## 8. Referencias

- [Arquitectura General](arquitectura/general.md)
- [Modelos de Datos](arquitectura/modelos_datos.md)
- [Catálogo de Servicios](servicios/catalogo.md)
- [Middleware Designer](middleware/README.md)
- [Microfrontend Designer UI](frontend/README.md)
