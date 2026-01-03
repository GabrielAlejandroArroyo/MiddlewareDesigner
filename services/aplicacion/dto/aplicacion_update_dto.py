from typing import Optional
from pydantic import BaseModel, Field

class AplicacionUpdateDTO(BaseModel):
    """DTO para actualización parcial (PATCH)"""
    descripcion: Optional[str] = Field(None, min_length=1, max_length=255, title="Descripción de la Aplicación", description="Nombre o descripción de la aplicación")
