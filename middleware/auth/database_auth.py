"""Proveedor de autenticación contra el servicio Usuario (BD)."""
from typing import Optional

import httpx
from auth.auth_config import AuthSettings, get_auth_settings
from auth.auth_provider import UserInfo


class DatabaseAuthProvider:
    """Valida credenciales contra el servicio Usuario (POST /auth/validate)."""

    def __init__(self, settings: Optional[AuthSettings] = None) -> None:
        self._settings = settings or get_auth_settings()
        self._url = f"{self._settings.usuario_service_url}/api/v1/auth/validate"

    def validate(self, username: Optional[str], password: Optional[str]) -> Optional[UserInfo]:
        if not username or not password:
            return None
        try:
            with httpx.Client(timeout=5.0) as client:
                r = client.post(
                    self._url,
                    json={"username": username, "password": password},
                )
                if r.status_code != 200:
                    return None
                data = r.json()
                if not data.get("valid"):
                    return None
                return UserInfo(
                    username=data.get("nombre_usuario") or username,
                    sub=data.get("usuario_id"),
                    requires_password_change=data.get("requires_password_change", False),
                )
        except (httpx.RequestError, KeyError):
            return None

    def validate_bearer(self, token: str) -> Optional[UserInfo]:
        """Database Auth no soporta Bearer."""
        return None
