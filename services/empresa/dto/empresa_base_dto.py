from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class EmpresaBaseDTO(BaseModel):
    descripcion: str = Field(..., description="Descripción de la empresa", example="Empresa de Desarrollo de Software")
    corporaciones_ids: List[int] = Field(default_factory=list, description="Lista de IDs de corporaciones asociadas", example=[1, 2])

class EmpresaCreateDTO(EmpresaBaseDTO):
    """DTO para crear una nueva empresa"""
    pass

class EmpresaReadDTO(EmpresaBaseDTO):
    """DTO para leer los datos de una empresa"""
    id: int = Field(..., description="Identificador único de la empresa", example=1)
    baja_logica: bool = Field(..., description="Indica si la empresa está dada de baja lógicamente", example=False)
    fecha_alta: datetime = Field(..., description="Fecha y hora de creación del registro", example="2025-01-01T10:00:00")
    fecha_modificacion: Optional[datetime] = Field(None, description="Fecha y hora de última modificación del registro", example="2025-01-01T10:00:00")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "descripcion": "Empresa de Desarrollo de Software",
                "baja_logica": False,
                "fecha_alta": "2025-01-01T10:00:00",
                "fecha_modificacion": "2025-01-01T10:00:00",
                "corporaciones_ids": [1, 2]
            }
        }

class EmpresaUpdateDTO(BaseModel):
    """DTO para actualizar los datos de una empresa"""
    descripcion: Optional[str] = Field(None, description="Nueva descripción de la empresa", example="Empresa de Desarrollo de Software - Actualizada")
    corporaciones_ids: Optional[List[int]] = Field(None, description="Nueva lista de IDs de corporaciones asociadas", example=[1, 2, 3])
    baja_logica: Optional[bool] = Field(None, description="Estado de baja lógica", example=False)

class EmpresaDeleteDTO(BaseModel):
    """DTO para la respuesta de eliminación de una empresa"""
    id: int = Field(..., description="ID de la empresa eliminada", example=1)
    success: bool = Field(..., description="Indica si la operación fue exitosa", example=True)
    message: str = Field(..., description="Mensaje descriptivo del resultado", example="Empresa dada de baja lógicamente")
