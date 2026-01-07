from pydantic import BaseModel, Field

class AplicacionRoleBaseDTO(BaseModel):
    id: str = Field(..., title="ID de Mapeo", description="Identificador que puede repetirse")
    id_aplicacion: str = Field(..., title="ID de Aplicación", description="Identificador único de la aplicación")
    id_role: str = Field(..., title="ID de Rol", description="Identificador único del rol")
