from pydantic import BaseModel, Field, field_validator

class PaisBaseDTO(BaseModel):
    """Base con validaciones comunes"""
    descripcion: str = Field(..., min_length=1, max_length=255)
    sigla_pais: str = Field(..., min_length=2, max_length=3)

    @field_validator('sigla_pais')
    @classmethod
    def validate_sigla_pais(cls, v: str) -> str:
        if not v.isalpha():
            raise ValueError('La sigla debe contener solo letras')
        return v.upper()

