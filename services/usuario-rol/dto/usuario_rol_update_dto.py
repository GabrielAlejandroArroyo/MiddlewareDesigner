from typing import Optional
from pydantic import BaseModel, Field
from dto.usuario_rol_base_dto import UsuarioRolBaseDTO

class UsuarioRolUpdateDTO(BaseModel):
    id: Optional[str] = Field(None, title="ID de Mapeo")
    id_usuario: Optional[str] = Field(None, title="ID de Usuario")
    id_aplicacion: Optional[str] = Field(None, title="ID de Aplicacion")
    id_rol: Optional[str] = Field(None, title="ID de Rol")

class UsuarioRolPutDTO(UsuarioRolBaseDTO):
    """DTO para actualización completa (PUT)"""
    pass
