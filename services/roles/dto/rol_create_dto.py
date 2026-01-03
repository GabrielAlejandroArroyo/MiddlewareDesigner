from pydantic import Field, field_validator
from dto.rol_base_dto import RolBaseDTO

class RolCreateDTO(RolBaseDTO):
    """DTO para la creación (POST) de un Rol"""
    id: str = Field(..., min_length=1, max_length=50, json_schema_extra={"unique": True}, title="ID de Rol", description="Identificador único alfanumérico del rol")

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El ID debe ser alfanumérico')
        return v
