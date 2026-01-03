from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from .localidad_base_dto import LocalidadBaseDTO

class LocalidadReadDTO(LocalidadBaseDTO):
    id: str = Field(..., json_schema_extra={"unique": True})
    baja_logica: bool
    fecha_alta_creacion: datetime
    fecha_alta_modificacion: Optional[datetime] = None

class LocalidadListDTO(BaseModel):
    localidad: List[LocalidadReadDTO] = Field(default_factory=list)
    total: int = 0
