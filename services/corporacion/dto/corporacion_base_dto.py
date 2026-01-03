from pydantic import BaseModel, Field

class CorporacionBaseDTO(BaseModel):
    """Base con validaciones comunes"""
    descripcion: str = Field(..., title="Descripción", min_length=1, max_length=255, description="Nombre o razón social de la corporación")
