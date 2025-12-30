from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from .pais_base_dto import PaisBaseDTO

class PaisReadDTO(PaisBaseDTO):
    """DTO para lectura y listado detallado de un país"""
    id: str = Field(..., description="Identificador único alfanumérico del país", json_schema_extra={"unique": True})
    baja_logica: bool = Field(..., description="Indica si el registro está inactivo lógicamente")
    fecha_alta_creacion: datetime = Field(..., description="Fecha y hora de creación del registro")
    fecha_alta_modificacion: Optional[datetime] = Field(None, description="Fecha y hora de la última modificación")

    class Config:
        from_attributes = True

class PaisListDTO(BaseModel):
    """Objeto contenedor para listados (Patrón RORO)"""
    paises: List[PaisReadDTO] = Field(..., description="Lista de países encontrados")
    total: int = Field(..., description="Cantidad total de registros que coinciden con la búsqueda")

