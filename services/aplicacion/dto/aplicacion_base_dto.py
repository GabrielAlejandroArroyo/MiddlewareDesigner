from pydantic import BaseModel, Field

class AplicacionBaseDTO(BaseModel):
    """Base con validaciones comunes para Aplicación"""
    descripcion: str = Field(..., min_length=1, max_length=255, title="Descripción de la Aplicación", description="Nombre o descripción de la aplicación")
