from pydantic import BaseModel, Field

class CorporacionDeleteDTO(BaseModel):
    """DTO para la respuesta de eliminación"""
    id: str = Field(..., description="ID del registro procesado")
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    mensaje: str = Field(..., description="Mensaje informativo sobre el resultado")
