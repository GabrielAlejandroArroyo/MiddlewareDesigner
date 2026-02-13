"""Interfaz de proveedor de autenticación (Basic ahora, OIDC/Keycloak después)."""
from __future__ import annotations

from typing import Optional, Protocol, runtime_checkable

from pydantic import BaseModel


class UserInfo(BaseModel):
    """Usuario autenticado; compatible con Basic y OIDC."""

    username: str
    sub: Optional[str] = None  # ID en IAM (OIDC)
    requires_password_change: bool = False


@runtime_checkable
class AuthProvider(Protocol):
    """Protocolo para validar credenciales y devolver UserInfo."""

    def validate(self, username: Optional[str], password: Optional[str]) -> Optional[UserInfo]:
        """Valida credenciales (Basic: user/pass). Devuelve UserInfo o None."""
        ...

    def validate_bearer(self, token: str) -> Optional[UserInfo]:
        """Valida token Bearer (JWT); para OIDC/Keycloak. Devuelve UserInfo o None."""
        ...
