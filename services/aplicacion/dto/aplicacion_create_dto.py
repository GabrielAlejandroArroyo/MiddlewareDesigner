from pydantic import Field, field_validator
from dto.aplicacion_base_dto import AplicacionBaseDTO

class AplicacionCreateDTO(AplicacionBaseDTO):
    """DTO para la creación (POST) de una Aplicación"""
    id: str = Field(..., min_length=1, max_length=50, json_schema_extra={"unique": True}, title="ID de Aplicación", description="Identificador único alfanumérico de la aplicación")

    @field_validator('id')
    @classmethod
    def validate_id(cls, v: str) -> str:
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('El ID debe ser alfanumérico')
        return v
