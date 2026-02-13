from typing import Optional
from pydantic import BaseModel, Field


class AuthValidateRequest(BaseModel):
    """Request para validar credenciales (login)."""
    username: str = Field(..., min_length=1, title="Usuario")
    password: str = Field(..., min_length=1, title="Contraseña")


class AuthValidateResponse(BaseModel):
    """Response de validación de credenciales."""
    valid: bool = Field(..., title="Válido")
    usuario_id: Optional[str] = Field(None, title="ID del usuario")
    nombre_usuario: Optional[str] = Field(None, title="Nombre de usuario")
    requires_password_change: bool = Field(False, title="Requiere cambio de contraseña")
