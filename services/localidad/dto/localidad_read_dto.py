from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from .localidad_base_dto import LocalidadBaseDTO

class LocalidadReadDTO(LocalidadBaseDTO):
    id: str
    baja_logica: bool
    fecha_alta_creacion: datetime
    fecha_alta_modificacion: Optional[datetime] = None

class LocalidadListDTO(BaseModel):
    localidades: List[LocalidadReadDTO] = Field(default_factory=list)
    total: int = 0
