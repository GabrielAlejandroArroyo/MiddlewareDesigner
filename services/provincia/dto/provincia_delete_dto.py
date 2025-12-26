from pydantic import BaseModel
from datetime import datetime

class ProvinciaDeleteDTO(BaseModel):
    id: str
    success: bool
    mensaje: str
    fecha_proceso: datetime = datetime.utcnow()

