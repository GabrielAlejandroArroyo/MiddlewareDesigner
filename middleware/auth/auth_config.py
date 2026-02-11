"""Configuración de autenticación desde variables de entorno."""
from __future__ import annotations

from functools import lru_cache
from typing import Literal, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


AuthType = Literal["none", "basic", "oidc"]


class AuthSettings(BaseSettings):
    """Configuración de auth: tipo, credenciales Basic y opciones OIDC (futuro)."""

    model_config = SettingsConfigDict(
        env_prefix="",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    auth_type: AuthType = "basic"
    # Basic Auth
    middleware_auth_user: str = "admin"
    middleware_auth_password: str = "admin"
    # OIDC (Keycloak) - para uso futuro
    oidc_issuer_url: Optional[str] = None
    oidc_audience: Optional[str] = None
    oidc_client_id: Optional[str] = None
    oidc_client_secret: Optional[str] = None


@lru_cache
def get_auth_settings() -> AuthSettings:
    """Singleton de configuración de auth (lectura desde env)."""
    return AuthSettings()
