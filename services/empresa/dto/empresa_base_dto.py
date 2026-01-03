from pydantic import BaseModel, Field

class EmpresaBaseDTO(BaseModel):
    """Base con validaciones comunes"""
    descripcion: str = Field(..., title="Descripción", min_length=1, max_length=255, description="Nombre o razón social de la empresa")
    identificador_fiscal: str = Field(..., title="Identificador Fiscal", min_length=5, max_length=20, description="Número de identificación tributaria (CUIT, NIT, etc.)")
    id_corporacion: str = Field(..., title="ID Corporación", description="Referencia a la corporación a la que pertenece la empresa")
