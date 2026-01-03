# Catálogo de Servicios Backend

El monorepo contiene microservicios desarrollados con **FastAPI** y **SQLAlchemy 2.0**.

## 1. Servicio de País (`/services/pais`)
- **Puerto predeterminado**: 8000
- **Responsabilidad**: Maestro de países.
- **Contrato**: `/api/v1/paises/`

## 2. Servicio de Provincia (`/services/provincia`)
- **Puerto predeterminado**: 8001
- **Responsabilidad**: Gestión de estados/provincias.
- **Dependencias**: Consume el servicio de País para validación de integridad referencial cruzada.
- **Contrato**: `/api/v1/provincias/`

## 3. Servicio de Localidad (`/services/localidad`)
- **Puerto predeterminado**: 8002
- **Responsabilidad**: Gestión de ciudades/localidades.
- **Dependencias**: Consume servicios de País y Provincia.
- **Contrato**: `/api/v1/localidades/`

## 4. Servicio de Corporación (`/services/corporacion`)
- **Puerto predeterminado**: 8003
- **Responsabilidad**: Gestión de corporaciones.
- **Contrato**: `/api/v1/corporaciones/`

## 5. Servicio de Empresa (`/services/empresa`)
- **Puerto predeterminado**: 8004
- **Responsabilidad**: Gestión de empresas.
- **Dependencias**: Consume el servicio de Corporación para validación de integridad referencial.
- **Contrato**: `/api/v1/empresas/`

## 6. Servicio de Aplicación (`/services/aplicacion`)
- **Puerto predeterminado**: 8005
- **Responsabilidad**: Gestión de aplicaciones del ecosistema.
- **Contrato**: `/api/v1/aplicaciones/`

## 7. Servicio de Roles (`/services/roles`)
- **Puerto predeterminado**: 8006
- **Responsabilidad**: Gestión de roles por aplicación.
- **Dependencias**: Consume el servicio de Aplicación para validación de integridad referencial.
- **Contrato**: `/api/v1/roles/`

---

## Patrones Comunes de Implementación

### Patrón RORO (Receive an Object, Return an Object)
Todos los listados devuelven un objeto envoltorio para facilitar la extensibilidad:
```json
{
  "entidad": [...],
  "total": 10
}
```

### DTOs Estándar
Cada servicio implementa:
- `xxxxReadDto`: Modelo de salida completo.
- `xxxxCreateDTO`: Modelo para creación (POST).
- `xxxxUpdateDTO`: Modelo para actualización parcial (PATCH).
- `xxxxPutDTO`: Modelo para actualización total (PUT).
- `xxxxListDto`: Modelo para colecciones.

### Auditoría y Baja Lógica
Todos los modelos incluyen:
- `baja_logica`: Flag para eliminación suave.
- `fecha_alta_creacion`: Timestamp automático.
- `fecha_alta_modificacion`: Timestamp de última edición.
