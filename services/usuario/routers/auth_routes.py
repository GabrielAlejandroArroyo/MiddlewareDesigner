"""Rutas de autenticación del servicio Usuario."""
from fastapi import APIRouter, HTTPException, status

from dto.auth_validate_dto import AuthValidateRequest, AuthValidateResponse
from dto.cambiar_password_dto import CambiarPasswordRequest
from dto.usuario_read_dto import UsuarioReadDTO
from services.usuario_service import (
    get_usuario_by_nombre_usuario,
    validate_credentials,
    cambiar_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/validate", response_model=AuthValidateResponse)
async def validate_login(body: AuthValidateRequest) -> AuthValidateResponse:
    """
    Valida credenciales (usuario/contraseña).
    Usado por el middleware para autenticación contra BD.
    """
    result = await validate_credentials(body.username, body.password)
    if result is None:
        return AuthValidateResponse(valid=False)
    usuario_id, nombre_usuario, requires = result
    return AuthValidateResponse(
        valid=True,
        usuario_id=usuario_id,
        nombre_usuario=nombre_usuario,
        requires_password_change=requires,
    )
