from pydantic import BaseModel, Field

class AplicacionRoleDeleteDTO(BaseModel):
    internal_id: int = Field(..., title="ID Interno")
    success: bool = Field(..., title="Éxito")
    mensaje: str = Field(..., title="Mensaje")
