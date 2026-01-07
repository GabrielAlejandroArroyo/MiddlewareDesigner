from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from dto.usuario_rol_base_dto import UsuarioRolBaseDTO

class UsuarioRolReadDTO(UsuarioRolBaseDTO):
    internal_id: int = Field(..., title="ID Interno")
    baja_logica: bool = Field(..., title="Baja Logica")
    fecha_alta_creacion: datetime = Field(..., title="Fecha de Creacion")
    fecha_alta_modificacion: Optional[datetime] = Field(None, title="Fecha de Modificacion")

    class Config:
        from_attributes = True

class UsuarioRolListDTO(BaseModel):
    usuario_roles: List[UsuarioRolReadDTO] = Field(..., title="Lista de Usuario-Roles")
    total: int = Field(..., title="Total de Registros")
