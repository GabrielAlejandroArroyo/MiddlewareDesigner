"""Dependencia FastAPI para obtener el usuario autenticado."""
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBasic, HTTPBasicCredentials, HTTPBearer

from auth.auth_config import get_auth_settings
from auth.auth_provider import AuthProvider, UserInfo
from auth.basic_auth import BasicAuthProvider
from auth.database_auth import DatabaseAuthProvider

_http_basic = HTTPBasic(auto_error=False)
_http_bearer = HTTPBearer(auto_error=False)


def _get_provider() -> AuthProvider:
    """Devuelve el AuthProvider según AUTH_TYPE (basic por defecto)."""
    settings = get_auth_settings()
    if settings.auth_type == "database":
        return DatabaseAuthProvider(settings)
    if settings.auth_type == "basic":
        return BasicAuthProvider(settings)
    return BasicAuthProvider(settings)


async def get_current_user(
    credentials: Optional[HTTPBasicCredentials] = Depends(_http_basic),
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(_http_bearer),
) -> Optional[UserInfo]:
    """
    Dependencia que valida Basic o Bearer y devuelve UserInfo.
    Si AUTH_TYPE=none, no exige credenciales (devuelve usuario anónimo).
    """
    settings = get_auth_settings()
    if settings.auth_type == "none":
        return UserInfo(username="anonymous", sub="anonymous")

    provider = _get_provider()

    # Intentar Basic
    if credentials is not None:
        user = provider.validate(credentials.username, credentials.password)
        if user is not None:
            return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )

    # Intentar Bearer (futuro OIDC)
    if bearer is not None:
        user = provider.validate_bearer(bearer.credentials)
        if user is not None:
            return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Basic"},
    )
