from typing import Optional
from .corporacion_base_dto import CorporacionBaseDTO

class CorporacionUpdateDTO(CorporacionBaseDTO):
    """DTO para actualización parcial (PATCH)"""
    descripcion: Optional[str] = None
