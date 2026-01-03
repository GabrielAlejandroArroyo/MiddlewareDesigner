from pydantic import BaseModel, Field

class RolBaseDTO(BaseModel):
    """Base con validaciones comunes para Rol"""
    descripcion: str = Field(..., min_length=1, max_length=255, title="Descripción del Rol", description="Nombre o descripción de la función del rol")
    id_aplicacion: str = Field(..., min_length=1, max_length=50, title="ID de Aplicación", description="Identificador único de la aplicación a la que pertenece el rol")
