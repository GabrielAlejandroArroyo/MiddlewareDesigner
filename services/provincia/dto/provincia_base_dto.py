from pydantic import BaseModel, Field

class ProvinciaBaseDTO(BaseModel):
    descripcion: str = Field(..., min_length=1, max_length=255)
    id_pais: str = Field(..., min_length=1, max_length=50, description="ID del país al que pertenece")

