from pydantic import BaseModel, Field, EmailStr

class UsuarioBaseDTO(BaseModel):
    """Base con validaciones comunes para Usuario"""
    email: EmailStr = Field(..., title="Email", description="Correo electrónico del usuario")
    nombre_usuario: str = Field(..., min_length=3, max_length=50, title="Nombre de Usuario", description="Nombre de cuenta único")
    nombre: str = Field(..., min_length=1, max_length=100, title="Nombre", description="Nombre del usuario")
    apellido: str = Field(..., min_length=1, max_length=100, title="Apellido", description="Apellido del usuario")
