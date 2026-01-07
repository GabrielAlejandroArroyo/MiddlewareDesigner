from pydantic import BaseModel, Field

class UsuarioRolCreateDTO(BaseModel):
    id: str = Field(..., title="ID de Mapeo")
    id_usuario: str = Field(..., title="ID de Usuario")
    id_aplicacion: str = Field(..., title="ID de Aplicacion")
    id_rol: str = Field(..., title="ID de Rol")
