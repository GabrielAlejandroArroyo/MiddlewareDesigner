from pydantic import Field, field_validator
from .provincia_base_dto import ProvinciaBaseDTO

class ProvinciaCreateDTO(ProvinciaBaseDTO):
    id: str = Field(..., min_length=1, max_length=50)

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El ID debe ser alfanumérico')
        return v

