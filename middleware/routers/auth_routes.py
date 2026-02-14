"""Rutas de autenticación (login, etc.)."""
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from auth.auth_config import get_auth_settings
from auth.dependencies import _get_provider

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    success: bool = Field(..., description="Credenciales válidas")
    requires_password_change: bool = Field(False, description="Usuario debe cambiar contraseña en primer login")
    usuario_id: Optional[str] = Field(None, description="ID del usuario (para cambio de contraseña)")
    session_timeout_minutes: int = Field(..., description="Tiempo de sesión en minutos (desconexión automática)")
    session_inactivity_minutes: int = Field(..., description="Tiempo de inactividad en minutos (logout si no hay interacción). 0 = deshabilitado")


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    """
    Valida credenciales (usuario/contraseña).
    Ruta pública; no requiere autenticación previa.
    Si success=True, el frontend guarda credenciales y usa Basic Auth para el resto de peticiones.
    Si requires_password_change=True, el frontend debe redirigir a /cambiar-password con usuario_id.
    """
    provider = _get_provider()
    user = provider.validate(body.username, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )
    settings = get_auth_settings()
    return LoginResponse(
        success=True,
        requires_password_change=user.requires_password_change,
        usuario_id=user.sub,
        session_timeout_minutes=settings.session_timeout_minutes,
        session_inactivity_minutes=settings.session_inactivity_minutes,
    )
