from pydantic import BaseModel, Field

class AplicacionRoleDeleteDTO(BaseModel):
    id: str = Field(..., title="ID")
    success: bool = Field(..., title="Éxito")
    mensaje: str = Field(..., title="Mensaje")
