from typing import Optional
from datetime import datetime
from .provincia_base_dto import ProvinciaBaseDTO

class ProvinciaReadDTO(ProvinciaBaseDTO):
    id: str
    baja_logica: bool
    fecha_alta_creacion: datetime
    fecha_alta_modificacion: Optional[datetime] = None

    class Config:
        from_attributes = True

