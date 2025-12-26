from pydantic import BaseModel, Field, field_validator
from typing import Optional

class PaisUpdateDTO(BaseModel):
    """DTO para actualización (PUT/PATCH)"""
    descripcion: Optional[str] = Field(None, min_length=1, max_length=255)
    sigla_pais: Optional[str] = Field(None, min_length=2, max_length=3)
    baja_logica: Optional[bool] = Field(None)

    @field_validator('sigla_pais')
    @classmethod
    def validate_sigla_pais(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if not v.isalpha():
                raise ValueError('La sigla debe contener solo letras')
            return v.upper()
        return v

