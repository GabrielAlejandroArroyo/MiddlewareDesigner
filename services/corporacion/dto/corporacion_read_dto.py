from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from .corporacion_base_dto import CorporacionBaseDTO

class CorporacionReadDTO(CorporacionBaseDTO):
    """DTO para lectura y listado detallado de una corporación"""
    id: str = Field(..., title="ID", description="Identificador único de la corporación", json_schema_extra={"unique": True})
    baja_logica: bool = Field(..., title="Baja Lógica", description="Indica si el registro está inactivo lógicamente")
    fecha_alta_creacion: datetime = Field(..., title="Fecha Creación", description="Fecha y hora de creación del registro")
    fecha_alta_modificacion: Optional[datetime] = Field(None, title="Fecha Modificación", description="Fecha y hora de la última modificación")

    class Config:
        from_attributes = True

class CorporacionListDTO(BaseModel):
    """Objeto contenedor para listados (Patrón RORO)"""
    corporacion: List[CorporacionReadDTO] = Field(..., description="Lista de corporaciones encontradas")
    total: int = Field(..., description="Cantidad total de registros que coinciden con la búsqueda")
