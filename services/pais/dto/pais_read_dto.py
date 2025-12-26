from typing import Optional
from datetime import datetime
from .pais_base_dto import PaisBaseDTO

class PaisReadDTO(PaisBaseDTO):
    """DTO para lectura y listado (GET)"""
    id: str
    baja_logica: bool
    fecha_alta_creacion: datetime
    fecha_alta_modificacion: Optional[datetime] = None

    class Config:
        from_attributes = True

