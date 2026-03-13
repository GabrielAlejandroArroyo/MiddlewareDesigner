from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# --- AppDefinition ---

class AppDefinitionCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=150)
    descripcion: Optional[str] = None
    slug: Optional[str] = Field(None, max_length=100)
    id_aplicacion: Optional[str] = None
    is_active: bool = True


class AppDefinitionUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=150)
    descripcion: Optional[str] = None
    slug: Optional[str] = Field(None, max_length=100)
    id_aplicacion: Optional[str] = None
    is_active: Optional[bool] = None


class AppDefinitionResponse(BaseModel):
    id: int
    id_aplicacion: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    slug: str
    is_active: bool
    baja_logica: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    roles: List["AppRoleConfigResponse"] = []
    menu_config: Optional["AppMenuConfigResponse"] = None

    class Config:
        from_attributes = True


# --- AppRoleConfig ---

class AppRoleConfigCreate(BaseModel):
    id_role: str = Field(..., min_length=1)
    role_nombre: str = Field(..., min_length=1)


class AppRoleConfigResponse(BaseModel):
    id: int
    app_definition_id: int
    id_role: str
    role_nombre: str
    is_active: bool
    modules: List["AppRoleModuleResponse"] = []

    class Config:
        from_attributes = True


# --- AppRoleModule ---

class AppRoleModuleCreate(BaseModel):
    backend_service_id: str
    endpoint_path: str
    metodo: str
    is_enabled: bool = True


class AppRoleModuleBatch(BaseModel):
    modules: List[AppRoleModuleCreate]


class AppRoleModuleResponse(BaseModel):
    id: int
    app_role_config_id: int
    backend_service_id: str
    endpoint_path: str
    metodo: str
    is_enabled: bool

    class Config:
        from_attributes = True


# --- AppMenuConfig ---

class MenuItemSchema(BaseModel):
    id: str
    label: str
    icon: str = "bi-circle"
    order: int = 0
    target_service_id: Optional[str] = None
    target_endpoint_path: Optional[str] = None
    target_endpoint_method: Optional[str] = None
    children: List["MenuItemSchema"] = []


class AppMenuConfigUpdate(BaseModel):
    menu_structure: List[MenuItemSchema]


class AppMenuConfigResponse(BaseModel):
    id: int
    app_definition_id: int
    menu_structure: Any = []

    class Config:
        from_attributes = True


# --- Runtime ---

class RuntimeModuleInfo(BaseModel):
    backend_service_id: str
    backend_service_nombre: Optional[str] = None
    backend_service_host: Optional[str] = None
    backend_service_puerto: Optional[int] = None
    endpoint_path: str
    metodo: str
    configuracion_ui: Dict = {}


class AppRuntimeResponse(BaseModel):
    app_id: int
    app_nombre: str
    app_slug: str
    role_id: str
    role_nombre: str
    menu_structure: List[Any] = []
    modules: List[RuntimeModuleInfo] = []


# --- Access Check ---

class AppAccessIssue(BaseModel):
    code: str
    severity: str  # "error" | "warning"
    message: str
    suggestion: str


class AppAccessCheckResponse(BaseModel):
    can_access: bool
    app_active: bool
    has_roles: bool
    has_modules: bool
    has_menu: bool
    total_roles: int = 0
    total_modules: int = 0
    menu_items_count: int = 0
    issues: List[AppAccessIssue] = []


# Rebuild para referencias circulares
MenuItemSchema.model_rebuild()
AppDefinitionResponse.model_rebuild()
AppRoleConfigResponse.model_rebuild()
