from pydantic import Field
from .localidad_base_dto import LocalidadBaseDTO

class LocalidadCreateDTO(LocalidadBaseDTO):
    id: str = Field(..., description="ID alfanumérico de la localidad", json_schema_extra={"unique": True})
