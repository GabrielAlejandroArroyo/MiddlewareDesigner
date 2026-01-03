from typing import Optional
from pydantic import BaseModel, Field

class EmpresaUpdateDTO(BaseModel):
    """DTO para actualización parcial (PATCH)"""
    descripcion: Optional[str] = Field(None, min_length=1, max_length=255)
    identificador_fiscal: Optional[str] = Field(None, min_length=5, max_length=20)
    id_corporacion: Optional[str] = Field(None)
