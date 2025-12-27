from pydantic import BaseModel, Field
from typing import Optional

class LocalidadUpdateDTO(BaseModel):
    descripcion: Optional[str] = None
    id_pais: Optional[str] = None
    id_provincia: Optional[str] = None

