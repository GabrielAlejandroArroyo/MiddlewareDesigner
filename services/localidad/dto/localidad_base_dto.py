from pydantic import BaseModel, ConfigDict, Field

class LocalidadBaseDTO(BaseModel):
    descripcion: str = Field(..., description="Descripción de la localidad")
    id_pais: str = Field(..., description="ID del país al que pertenece")
    id_provincia: str = Field(..., description="ID de la provincia a la que pertenece")
    
    model_config = ConfigDict(from_attributes=True)

