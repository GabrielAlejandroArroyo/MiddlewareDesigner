from typing import Optional
from pydantic import Field, field_validator
from dto.aplicacion_base_dto import AplicacionBaseDTO

class AplicacionCreateDTO(AplicacionBaseDTO):
    """DTO para la creación (POST) de una Aplicación"""
    id: Optional[str] = Field(None, min_length=1, max_length=50, title="ID de Aplicación", description="Opcional. Si no se envía, se genera automáticamente (formato APLI_YYMMDDHHMMSSFFFF)")

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.replace('_', '').replace('-', '').replace('.', '').isalnum():
            raise ValueError('El ID debe ser alfanumérico')
        return v
