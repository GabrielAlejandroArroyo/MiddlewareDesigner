from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from .empresa_base_dto import EmpresaBaseDTO

class EmpresaReadDTO(EmpresaBaseDTO):
    """DTO para lectura y listado detallado de una empresa"""
    id: str = Field(..., title="ID", description="Identificador único de la empresa")
    baja_logica: bool = Field(..., title="Baja Lógica", description="Indica si el registro está inactivo lógicamente")
    fecha_alta_creacion: datetime = Field(..., title="Fecha Creación", description="Fecha y hora de creación del registro")
    fecha_alta_modificacion: Optional[datetime] = Field(None, title="Fecha Modificación", description="Fecha y hora de la última modificación")

    class Config:
        from_attributes = True

class EmpresaListDTO(BaseModel):
    """Objeto contenedor para listados (Patrón RORO)"""
    empresa: List[EmpresaReadDTO] = Field(..., description="Lista de empresas encontradas")
    total: int = Field(..., description="Cantidad total de registros que coinciden con la búsqueda")
    
    class Config:
        from_attributes = True
