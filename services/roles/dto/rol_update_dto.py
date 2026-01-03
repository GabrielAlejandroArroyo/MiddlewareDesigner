from typing import Optional
from pydantic import BaseModel, Field

class RolUpdateDTO(BaseModel):
    """DTO para actualización parcial (PATCH) de Rol"""
    descripcion: Optional[str] = Field(None, min_length=1, max_length=255, title="Descripción del Rol", description="Nombre o descripción de la función del rol")
    id_aplicacion: Optional[str] = Field(None, min_length=1, max_length=50, title="ID de Aplicación", description="Identificador único de la aplicación a la que pertenece el rol")
