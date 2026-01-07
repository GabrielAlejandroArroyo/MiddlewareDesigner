from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from dto.aplicacion_role_base_dto import AplicacionRoleBaseDTO

class AplicacionRoleReadDTO(AplicacionRoleBaseDTO):
    internal_id: int = Field(..., title="ID Interno", description="Clave primaria real")
    baja_logica: bool = Field(..., title="Baja Lógica")
    fecha_alta_creacion: datetime = Field(..., title="Fecha de Creación")
    fecha_alta_modificacion: Optional[datetime] = Field(None, title="Fecha de Modificación")

    class Config:
        from_attributes = True

class AplicacionRoleListDTO(BaseModel):
    aplicacion_roles: List[AplicacionRoleReadDTO] = Field(..., title="Lista de Aplicacion-Roles")
    total: int = Field(..., title="Total de Registros")
