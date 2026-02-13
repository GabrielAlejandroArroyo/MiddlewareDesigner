from pydantic import BaseModel, Field


class CambiarPasswordRequest(BaseModel):
    """Request para cambiar contraseña."""
    password_actual: str = Field(..., min_length=1, title="Contraseña actual")
    password_nueva: str = Field(..., min_length=1, title="Contraseña nueva")
