from pydantic import BaseModel, Field
from datetime import datetime

class EmpresaDeleteDTO(BaseModel):
    """Respuesta tras eliminación"""
    id: str = Field(..., description="ID del registro procesado")
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    mensaje: str = Field(..., description="Mensaje informativo sobre el resultado")
    fecha_proceso: datetime = Field(default_factory=datetime.utcnow)
