from pydantic import BaseModel, Field

class CorporacionDeleteDTO(BaseModel):
    """DTO para la respuesta de eliminación de una corporación"""
    id: int = Field(..., description="ID de la corporación eliminada", example=1)
    success: bool = Field(..., description="Indica si la operación fue exitosa", example=True)
    message: str = Field(..., description="Mensaje descriptivo del resultado", example="Corporación dada de baja lógicamente")
