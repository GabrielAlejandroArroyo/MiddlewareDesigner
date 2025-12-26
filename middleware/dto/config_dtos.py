from pydantic import BaseModel, Field
from typing import Optional, List, Dict

# DTOs para Microfrontends (Frontend Services)
class FrontendServiceBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    is_active: bool = True

class FrontendServiceCreate(FrontendServiceBase):
    id: str

# DTOs para Microbackends (Backend Services)
class BackendServiceBase(BaseModel):
    id: str
    openapi_url: str
    descripcion: Optional[str] = None
    is_active: bool = True

class BackendServiceCreate(BackendServiceBase):
    pass

class BackendServiceResponse(BackendServiceBase):
    nombre: str
    host: str
    puerto: int
    class Config:
        from_attributes = True

# DTOs para Mappings
class BackendMappingBase(BaseModel):
    backend_service_id: str
    endpoint_path: str
    metodo: str
    configuracion_ui: Dict = {}

class BackendMappingCreate(BackendMappingBase):
    frontend_service_id: str

class FrontendServiceResponse(FrontendServiceBase):
    id: str
    mappings: List[BackendMappingBase] = []
    class Config:
        from_attributes = True
