from pydantic import BaseModel, Field

class RolDeleteDTO(BaseModel):
    """DTO para la respuesta de eliminación de un Rol"""
    id: str = Field(..., description="ID del registro procesado", title="ID de Rol")
    success: bool = Field(..., description="Indica si la operación fue exitosa", title="Éxito")
    mensaje: str = Field(..., description="Mensaje informativo sobre el resultado", title="Mensaje")
