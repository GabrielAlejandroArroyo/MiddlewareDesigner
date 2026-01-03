from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from dto.aplicacion_base_dto import AplicacionBaseDTO

class AplicacionReadDTO(AplicacionBaseDTO):
    """DTO para lectura y listado detallado de una Aplicación"""
    id: str = Field(..., description="Identificador único alfanumérico de la aplicación", json_schema_extra={"unique": True}, title="ID de Aplicación")
    baja_logica: bool = Field(..., description="Indica si el registro está inactivo lógicamente", title="Baja Lógica")
    fecha_alta_creacion: datetime = Field(..., description="Fecha y hora de creación del registro", title="Fecha de Creación")
    fecha_alta_modificacion: Optional[datetime] = Field(None, description="Fecha y hora de la última modificación", title="Fecha de Modificación")

    class Config:
        from_attributes = True

class AplicacionListDTO(BaseModel):
    """Objeto contenedor para listados (Patrón RORO) de Aplicaciones"""
    aplicacion: List[AplicacionReadDTO] = Field(..., description="Lista de aplicaciones encontradas", title="Lista de Aplicaciones")
    total: int = Field(..., description="Cantidad total de registros que coinciden con la búsqueda", title="Total de Registros")
