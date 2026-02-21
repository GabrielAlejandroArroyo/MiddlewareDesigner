from typing import Optional
from pydantic import BaseModel, Field, EmailStr
from dto.usuario_base_dto import UsuarioBaseDTO

class UsuarioUpdateDTO(BaseModel):
    """DTO para actualización parcial (PATCH)"""
    email: Optional[EmailStr] = Field(None, title="Email")
    nombre_usuario: Optional[str] = Field(None, min_length=3, max_length=50, title="Nombre de Usuario")
    nombre: Optional[str] = Field(None, min_length=1, max_length=100, title="Nombre")
    apellido: Optional[str] = Field(None, min_length=1, max_length=100, title="Apellido")

class UsuarioPutDTO(UsuarioBaseDTO):
    """DTO para actualización completa (PUT). Incluye todos los atributos editables del modelo."""
    requiere_cambio_password: bool = Field(False, title="Requiere Cambio de Contraseña", description="Si True, el usuario debe cambiar la contraseña en el próximo login")
    baja_logica: bool = Field(False, title="Baja Lógica", description="Si True, el usuario está dado de baja (soft delete)")
    password: Optional[str] = Field(None, min_length=1, max_length=255, title="Nueva Contraseña", description="Opcional. Si se envía, se actualiza la contraseña (será hasheada)")
