from typing import Optional
from pydantic import BaseModel, Field

class UsuarioRolCreateDTO(BaseModel):
    id: Optional[str] = Field(None, title="ID de Mapeo", description="Opcional. Si no se envía, se genera (formato USRO_YYMMDDHHMMSSFFFF)")
    id_usuario: str = Field(..., title="ID de Usuario")
    id_aplicacion: str = Field(..., title="ID de Aplicacion")
    id_rol: str = Field(..., title="ID de Rol")
