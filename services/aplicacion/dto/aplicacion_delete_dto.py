from pydantic import BaseModel, Field

class AplicacionDeleteDTO(BaseModel):
    """DTO para la respuesta de eliminación de una Aplicación"""
    id: str = Field(..., description="ID del registro procesado", title="ID de Aplicación")
    success: bool = Field(..., description="Indica si la operación fue exitosa", title="Éxito")
    mensaje: str = Field(..., description="Mensaje informativo sobre el resultado", title="Mensaje")
