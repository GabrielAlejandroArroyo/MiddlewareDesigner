from pydantic import BaseModel, Field
from datetime import datetime

class PaisDeleteDTO(BaseModel):
    """DTO de respuesta tras eliminación"""
    id: str
    success: bool
    mensaje: str
    fecha_proceso: datetime = Field(default_factory=datetime.utcnow)

