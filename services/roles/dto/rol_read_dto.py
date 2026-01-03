from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from dto.rol_base_dto import RolBaseDTO

class RolReadDTO(RolBaseDTO):
    """DTO para lectura y listado detallado de un Rol"""
    id: str = Field(..., description="Identificador único alfanumérico del rol", json_schema_extra={"unique": True}, title="ID de Rol")
    baja_logica: bool = Field(..., description="Indica si el registro está inactivo lógicamente", title="Baja Lógica")
    fecha_alta_creacion: datetime = Field(..., description="Fecha y hora de creación del registro", title="Fecha de Creación")
    fecha_alta_modificacion: Optional[datetime] = Field(None, description="Fecha y hora de la última modificación", title="Fecha de Modificación")

    class Config:
        from_attributes = True

class RolListDTO(BaseModel):
    """Objeto contenedor para listados (Patrón RORO) de Roles"""
    roles: List[RolReadDTO] = Field(..., description="Lista de roles encontrados", title="Lista de Roles")
    total: int = Field(..., description="Cantidad total de registros que coinciden con la búsqueda", title="Total de Registros")
