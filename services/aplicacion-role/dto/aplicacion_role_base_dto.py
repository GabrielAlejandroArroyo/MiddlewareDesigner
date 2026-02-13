from typing import Optional
from pydantic import BaseModel, Field

class AplicacionRoleBaseDTO(BaseModel):
    id: Optional[str] = Field(None, title="ID", description="Opcional. Si no se envía, se genera (formato APRL_YYMMDDHHMMSSFFFF)")
    id_aplicacion: str = Field(..., title="ID de Aplicación", description="Identificador único de la aplicación")
    id_role: str = Field(..., title="ID de Rol", description="Identificador único del rol")
