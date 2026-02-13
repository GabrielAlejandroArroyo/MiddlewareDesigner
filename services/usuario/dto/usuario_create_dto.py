from typing import Optional
from pydantic import Field, field_validator
from dto.usuario_base_dto import UsuarioBaseDTO

class UsuarioCreateDTO(UsuarioBaseDTO):
    """DTO para la creación (POST) de un Usuario"""
    id: Optional[str] = Field(None, min_length=1, max_length=50, title="ID de Usuario", description="Opcional. Si no se envía, se genera automáticamente (formato USUA_YYMMDDHHMMSSFFFF)")
    password: str = Field(..., min_length=1, max_length=255, title="Contraseña", description="Contraseña del usuario (será hasheada)")
    requiere_cambio_password: bool = Field(False, title="Requiere Cambio", description="Si True, el usuario debe cambiar la contraseña en el próximo login")

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.replace('_', '').replace('-', '').replace('.', '').isalnum():
            raise ValueError('El ID debe ser alfanumérico')
        return v
