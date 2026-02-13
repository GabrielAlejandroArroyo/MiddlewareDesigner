"""Proveedor de autenticación Basic (usuario/contraseña contra env)."""
from typing import Optional

from auth.auth_config import AuthSettings, get_auth_settings
from auth.auth_provider import UserInfo


class BasicAuthProvider:
    """Valida credenciales Basic contra MIDDLEWARE_AUTH_USER / MIDDLEWARE_AUTH_PASSWORD."""

    def __init__(self, settings: Optional[AuthSettings] = None) -> None:
        self._settings = settings or get_auth_settings()

    def validate(self, username: Optional[str], password: Optional[str]) -> Optional[UserInfo]:
        if not username or not password:
            return None
        if username != self._settings.middleware_auth_user:
            return None
        if password != self._settings.middleware_auth_password:
            return None
        return UserInfo(username=username, sub=username, requires_password_change=False)

    def validate_bearer(self, token: str) -> Optional[UserInfo]:
        """Basic Auth no soporta Bearer; para OIDC/Keycloak."""
        return None
