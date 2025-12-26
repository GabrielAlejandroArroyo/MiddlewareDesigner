from pydantic import BaseModel, Field
from typing import Optional

class ProvinciaUpdateDTO(BaseModel):
    """DTO para actualización parcial (PATCH)"""
    descripcion: Optional[str] = Field(None, min_length=1, max_length=255)
    id_pais: Optional[str] = Field(None, min_length=1, max_length=50)
    baja_logica: Optional[bool] = Field(None)

