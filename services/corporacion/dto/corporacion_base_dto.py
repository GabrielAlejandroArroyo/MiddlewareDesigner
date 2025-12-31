from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# --- DTOs de Corporación ---

class CorporacionBaseDTO(BaseModel):
    descripcion: str = Field(..., description="Descripción de la corporación", example="Corporación de Tecnología S.A.")

class CorporacionCreateDTO(CorporacionBaseDTO):
    """DTO para crear una nueva corporación"""
    pass

class CorporacionReadDTO(CorporacionBaseDTO):
    """DTO para leer los datos de una corporación"""
    id: int = Field(..., description="Identificador único de la corporación", example=1)
    baja_logica: bool = Field(..., description="Indica si la corporación está dada de baja lógicamente", example=False)
    fecha_alta: datetime = Field(..., description="Fecha y hora de creación del registro", example="2025-01-01T10:00:00")
    fecha_modificacion: Optional[datetime] = Field(None, description="Fecha y hora de última modificación del registro", example="2025-01-01T10:00:00")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "descripcion": "Corporación de Tecnología S.A.",
                "baja_logica": False,
                "fecha_alta": "2025-01-01T10:00:00",
                "fecha_modificacion": "2025-01-01T10:00:00"
            }
        }

class CorporacionUpdateDTO(BaseModel):
    """DTO para actualizar los datos de una corporación"""
    descripcion: Optional[str] = Field(None, description="Nueva descripción de la corporación", example="Corporación de Tecnología S.A. - Actualizada")
    baja_logica: Optional[bool] = Field(None, description="Estado de baja lógica", example=False)
