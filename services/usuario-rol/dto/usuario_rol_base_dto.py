from pydantic import BaseModel, Field

class UsuarioRolBaseDTO(BaseModel):
    id: str = Field(..., title="ID de Mapeo", description="Identificador que puede repetirse")
    id_usuario: str = Field(..., title="ID de Usuario", description="Identificador unico del usuario")
    id_aplicacion: str = Field(..., title="ID de Aplicacion", description="Identificador unico de la aplicacion")
    id_rol: str = Field(..., title="ID de Rol", description="Identificador unico del rol")
