from pydantic import BaseModel, Field

class UsuarioDeleteDTO(BaseModel):
    """Respuesta de eliminación"""
    id: str = Field(..., title="ID de Usuario")
    success: bool = Field(..., title="Éxito")
    mensaje: str = Field(..., title="Mensaje")
