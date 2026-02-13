from typing import Optional
from pydantic import Field, field_validator
from dto.rol_base_dto import RolBaseDTO

class RolCreateDTO(RolBaseDTO):
    """DTO para la creación (POST) de un Rol"""
    id: Optional[str] = Field(None, min_length=1, max_length=50, title="ID de Rol", description="Opcional. Si no se envía, se genera (formato ROLE_YYMMDDHHMMSSFFFF)")

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.replace('_', '').replace('-', '').replace('.', '').isalnum():
            raise ValueError('El ID debe ser alfanumérico')
        return v
