from pydantic import Field, field_validator
from .corporacion_base_dto import CorporacionBaseDTO

class CorporacionCreateDTO(CorporacionBaseDTO):
    """DTO para la creación (POST)"""
    id: str = Field(..., min_length=1, max_length=50, json_schema_extra={"unique": True})

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El ID debe ser alfanumérico')
        return v
