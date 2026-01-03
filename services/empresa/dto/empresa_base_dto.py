from pydantic import BaseModel, Field

class EmpresaBaseDTO(BaseModel):
    """Base con validaciones comunes"""
    descripcion: str = Field(..., title="Descripción", min_length=1, max_length=255, description="Nombre o razón social de la empresa")
    id_corporacion: str = Field(..., title="ID Corporación", description="Referencia a la corporación a la que pertenece la empresa")
