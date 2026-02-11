# Módulo de autenticación: Basic Auth y preparado para OIDC (Keycloak)
from auth.auth_config import AuthSettings, get_auth_settings
from auth.auth_provider import AuthProvider, UserInfo
from auth.basic_auth import BasicAuthProvider
from auth.dependencies import get_current_user

__all__ = [
    "AuthSettings",
    "get_auth_settings",
    "AuthProvider",
    "UserInfo",
    "BasicAuthProvider",
    "get_current_user",
]
