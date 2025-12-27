from typing import Optional
from pydantic import BaseModel, Field

class LocalidadUpdateDTO(BaseModel):
    descripcion: Optional[str] = None
    id_pais: Optional[str] = None
    id_provincia: Optional[str] = None

class LocalidadPutDTO(BaseModel):
    descripcion: str
    id_pais: str
    id_provincia: str
