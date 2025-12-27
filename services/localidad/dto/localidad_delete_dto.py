from pydantic import BaseModel

class LocalidadDeleteDTO(BaseModel):
    id: str
    success: bool
    mensaje: str

