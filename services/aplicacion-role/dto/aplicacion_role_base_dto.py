from pydantic import BaseModel, Field

class AplicacionRoleBaseDTO(BaseModel):
    id: str = Field(..., title="ID", description="Identificador único del vínculo Aplicación-Role")
    id_aplicacion: str = Field(..., title="ID de Aplicación", description="Identificador único de la aplicación")
    id_role: str = Field(..., title="ID de Rol", description="Identificador único del rol")
