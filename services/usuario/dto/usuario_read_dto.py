from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from dto.usuario_base_dto import UsuarioBaseDTO

class UsuarioReadDTO(UsuarioBaseDTO):
    """DTO para lectura detallada de un Usuario"""
    id: str = Field(..., title="ID de Usuario")
    baja_logica: bool = Field(..., title="Baja Lógica")
    fecha_alta_creacion: datetime = Field(..., title="Fecha de Creación")
    fecha_alta_modificacion: Optional[datetime] = Field(None, title="Fecha de Modificación")

    class Config:
        from_attributes = True

class UsuarioListDTO(BaseModel):
    """Contenedor para listados de Usuarios"""
    usuarios: List[UsuarioReadDTO] = Field(..., title="Lista de Usuarios")
    total: int = Field(..., title="Total de Registros")
