from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from config.database import AsyncSessionLocal
from dto.app_dtos import (
    AppDefinitionCreate, AppDefinitionUpdate, AppDefinitionResponse,
    AppRoleConfigCreate, AppRoleConfigResponse,
    AppRoleModuleBatch, AppRoleModuleResponse,
    AppMenuConfigUpdate, AppMenuConfigResponse,
    AppRuntimeResponse,
)
from services import app_service
from auth.dependencies import get_current_user

router = APIRouter(
    prefix="/apps",
    tags=["Application Management"],
)

_auth = [Depends(get_current_user)]


def _app_to_response(app_def) -> dict:
    data = {
        "id": app_def.id,
        "id_aplicacion": app_def.id_aplicacion,
        "nombre": app_def.nombre,
        "descripcion": app_def.descripcion,
        "slug": app_def.slug,
        "is_active": app_def.is_active,
        "baja_logica": app_def.baja_logica,
        "created_at": app_def.created_at.isoformat() if app_def.created_at else None,
        "updated_at": app_def.updated_at.isoformat() if app_def.updated_at else None,
        "roles": [],
        "menu_config": None,
    }
    if hasattr(app_def, "roles") and app_def.roles:
        for role in app_def.roles:
            role_data = {
                "id": role.id,
                "app_definition_id": role.app_definition_id,
                "id_role": role.id_role,
                "role_nombre": role.role_nombre,
                "is_active": role.is_active,
                "modules": [],
            }
            if hasattr(role, "modules") and role.modules:
                role_data["modules"] = [
                    {
                        "id": m.id,
                        "app_role_config_id": m.app_role_config_id,
                        "backend_service_id": m.backend_service_id,
                        "endpoint_path": m.endpoint_path,
                        "metodo": m.metodo,
                        "is_enabled": m.is_enabled,
                    }
                    for m in role.modules
                ]
            data["roles"].append(role_data)
    if hasattr(app_def, "menu_config") and app_def.menu_config:
        data["menu_config"] = {
            "id": app_def.menu_config.id,
            "app_definition_id": app_def.menu_config.app_definition_id,
            "menu_structure": app_def.menu_config.menu_structure,
        }
    return data


# --- Rutas públicas (sin auth) - DEBEN ir primero para evitar conflicto con {app_id} ---

@router.get("/by-slug/{slug}", response_model=AppDefinitionResponse)
async def get_app_by_slug(slug: str):
    async with AsyncSessionLocal() as session:
        app_def = await app_service.get_app_by_slug(session, slug)
        if not app_def or app_def.baja_logica:
            raise HTTPException(status_code=404, detail="Aplicación no encontrada")
        return _app_to_response(app_def)


@router.get("/{app_id}/runtime/{role_id}", response_model=AppRuntimeResponse)
async def get_runtime(app_id: int, role_id: str):
    async with AsyncSessionLocal() as session:
        try:
            return await app_service.get_runtime_config(session, app_id, role_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))


# --- CRUD AppDefinition (protegido) ---

@router.post("", response_model=AppDefinitionResponse, dependencies=_auth)
async def create_app(data: AppDefinitionCreate):
    async with AsyncSessionLocal() as session:
        try:
            app_def = await app_service.create_app_definition(session, data)
            await session.commit()
            await session.refresh(app_def)
            return _app_to_response(app_def)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[AppDefinitionResponse], dependencies=_auth)
async def list_apps(include_deleted: bool = Query(False)):
    async with AsyncSessionLocal() as session:
        apps = await app_service.list_app_definitions(session, include_deleted)
        return [_app_to_response(a) for a in apps]


@router.get("/{app_id}", response_model=AppDefinitionResponse, dependencies=_auth)
async def get_app(app_id: int):
    async with AsyncSessionLocal() as session:
        app_def = await app_service.get_app_definition(session, app_id)
        if not app_def:
            raise HTTPException(status_code=404, detail="Aplicación no encontrada")
        return _app_to_response(app_def)


@router.put("/{app_id}", response_model=AppDefinitionResponse, dependencies=_auth)
async def update_app(app_id: int, data: AppDefinitionUpdate):
    async with AsyncSessionLocal() as session:
        try:
            app_def = await app_service.update_app_definition(session, app_id, data)
            await session.commit()
            await session.refresh(app_def)
            return _app_to_response(app_def)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{app_id}", dependencies=_auth)
async def delete_app(app_id: int):
    async with AsyncSessionLocal() as session:
        try:
            await app_service.delete_app_definition(session, app_id)
            await session.commit()
            return {"status": "success", "message": "Aplicación dada de baja"}
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))


# --- Roles ---

@router.get("/{app_id}/roles", response_model=List[AppRoleConfigResponse], dependencies=_auth)
async def get_app_roles(app_id: int):
    async with AsyncSessionLocal() as session:
        roles = await app_service.list_app_roles(session, app_id)
        return roles


@router.post("/{app_id}/roles", response_model=AppRoleConfigResponse, dependencies=_auth)
async def add_app_role(app_id: int, data: AppRoleConfigCreate):
    async with AsyncSessionLocal() as session:
        try:
            role_cfg = await app_service.assign_role(session, app_id, data)
            await session.commit()
            await session.refresh(role_cfg)
            return role_cfg
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{app_id}/roles/{role_config_id}", dependencies=_auth)
async def remove_app_role(app_id: int, role_config_id: int):
    async with AsyncSessionLocal() as session:
        try:
            await app_service.remove_role(session, role_config_id)
            await session.commit()
            return {"status": "success", "message": "Rol removido"}
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))


# --- Modules ---

@router.get("/{app_id}/roles/{role_config_id}/modules", response_model=List[AppRoleModuleResponse], dependencies=_auth)
async def get_role_modules(app_id: int, role_config_id: int):
    async with AsyncSessionLocal() as session:
        return await app_service.get_role_modules(session, role_config_id)


@router.put("/{app_id}/roles/{role_config_id}/modules", response_model=List[AppRoleModuleResponse], dependencies=_auth)
async def set_role_modules(app_id: int, role_config_id: int, data: AppRoleModuleBatch):
    async with AsyncSessionLocal() as session:
        try:
            modules = await app_service.set_role_modules(session, role_config_id, data.modules)
            await session.commit()
            return modules
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))


# --- Menu ---

@router.get("/{app_id}/menu", response_model=AppMenuConfigResponse, dependencies=_auth)
async def get_app_menu(app_id: int):
    async with AsyncSessionLocal() as session:
        menu = await app_service.get_menu(session, app_id)
        if not menu:
            raise HTTPException(status_code=404, detail="Menú no configurado")
        return menu


@router.put("/{app_id}/menu", response_model=AppMenuConfigResponse, dependencies=_auth)
async def save_app_menu(app_id: int, data: AppMenuConfigUpdate):
    async with AsyncSessionLocal() as session:
        menu = await app_service.save_menu(session, app_id, data)
        await session.commit()
        await session.refresh(menu)
        return menu


@router.post("/{app_id}/menu/auto-generate", response_model=AppMenuConfigResponse, dependencies=_auth)
async def auto_generate_app_menu(app_id: int):
    async with AsyncSessionLocal() as session:
        try:
            menu = await app_service.auto_generate_menu(session, app_id)
            await session.commit()
            await session.refresh(menu)
            return menu
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
