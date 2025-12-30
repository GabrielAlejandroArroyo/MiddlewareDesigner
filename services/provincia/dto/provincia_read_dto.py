from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from .provincia_base_dto import ProvinciaBaseDTO

class ProvinciaReadDTO(ProvinciaBaseDTO):
    """DTO para lectura detallada de una provincia"""
    id: str = Field(..., description="Identificador único de la provincia", json_schema_extra={"unique": True})
    baja_logica: bool = Field(..., description="Indica si la provincia está inactiva")
    fecha_alta_creacion: datetime = Field(..., description="Fecha de creación")
    fecha_alta_modificacion: Optional[datetime] = Field(None, description="Fecha de última actualización")

    class Config:
        from_attributes = True

class ProvinciaListDTO(BaseModel):
    """Contenedor para listado de provincias (Patrón RORO)"""
    provincias: List[ProvinciaReadDTO] = Field(..., description="Lista de provincias")
    total: int = Field(..., description="Total de registros")

