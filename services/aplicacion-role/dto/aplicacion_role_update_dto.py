from typing import Optional
from pydantic import BaseModel, Field

class AplicacionRoleUpdateDTO(BaseModel):
    id: Optional[str] = Field(None, title="ID de Mapeo")
    id_aplicacion: Optional[str] = Field(None, title="ID de Aplicación")
    id_role: Optional[str] = Field(None, title="ID de Rol")

class AplicacionRolePutDTO(BaseModel):
    id: str = Field(..., title="ID de Mapeo")
    id_aplicacion: str = Field(..., title="ID de Aplicación")
    id_role: str = Field(..., title="ID de Rol")
