from pydantic import Field, field_validator
from dto.usuario_base_dto import UsuarioBaseDTO

class UsuarioCreateDTO(UsuarioBaseDTO):
    """DTO para la creación (POST) de un Usuario"""
    id: str = Field(..., min_length=1, max_length=50, json_schema_extra={"unique": True}, title="ID de Usuario", description="Identificador único alfanumérico del usuario")

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El ID debe ser alfanumérico')
        return v
