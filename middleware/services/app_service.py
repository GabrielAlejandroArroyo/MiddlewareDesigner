import re
from typing import Optional, List, Dict, Any
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from entity.app_models import AppDefinition, AppRoleConfig, AppRoleModule, AppMenuConfig
from entity.config_models import BackendService, BackendMapping
from dto.app_dtos import (
    AppDefinitionCreate, AppDefinitionUpdate,
    AppRoleConfigCreate, AppRoleModuleCreate,
    AppMenuConfigUpdate, MenuItemSchema,
    RuntimeModuleInfo, AppRuntimeResponse,
    AppAccessCheckResponse, AppAccessIssue,
)


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[áàäâ]", "a", text)
    text = re.sub(r"[éèëê]", "e", text)
    text = re.sub(r"[íìïî]", "i", text)
    text = re.sub(r"[óòöô]", "o", text)
    text = re.sub(r"[úùüû]", "u", text)
    text = re.sub(r"[ñ]", "n", text)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


async def create_app_definition(session: AsyncSession, data: AppDefinitionCreate) -> AppDefinition:
    slug = data.slug or _slugify(data.nombre)

    existing = await session.execute(
        select(AppDefinition).where(AppDefinition.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Ya existe una aplicación con el slug '{slug}'")

    app_def = AppDefinition(
        nombre=data.nombre,
        descripcion=data.descripcion,
        slug=slug,
        id_aplicacion=data.id_aplicacion,
        is_active=data.is_active,
    )
    session.add(app_def)
    await session.flush()
    await session.refresh(app_def)
    return app_def


async def update_app_definition(
    session: AsyncSession, app_id: int, data: AppDefinitionUpdate
) -> AppDefinition:
    app_def = await session.get(AppDefinition, app_id)
    if not app_def or app_def.baja_logica:
        raise ValueError("Aplicación no encontrada o dada de baja")

    if data.nombre is not None:
        app_def.nombre = data.nombre
    if data.descripcion is not None:
        app_def.descripcion = data.descripcion
    if data.slug is not None:
        dup = await session.execute(
            select(AppDefinition).where(
                AppDefinition.slug == data.slug, AppDefinition.id != app_id
            )
        )
        if dup.scalar_one_or_none():
            raise ValueError(f"Ya existe otra aplicación con el slug '{data.slug}'")
        app_def.slug = data.slug
    if data.id_aplicacion is not None:
        app_def.id_aplicacion = data.id_aplicacion if data.id_aplicacion else None
    if data.is_active is not None:
        app_def.is_active = data.is_active

    await session.flush()
    await session.refresh(app_def)
    return app_def


async def delete_app_definition(session: AsyncSession, app_id: int) -> None:
    app_def = await session.get(AppDefinition, app_id)
    if not app_def:
        raise ValueError("Aplicación no encontrada")
    app_def.baja_logica = True
    await session.flush()


async def list_app_definitions(
    session: AsyncSession, include_deleted: bool = False
) -> List[AppDefinition]:
    query = select(AppDefinition)
    if not include_deleted:
        query = query.where(AppDefinition.baja_logica == False)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_app_definition(session: AsyncSession, app_id: int) -> Optional[AppDefinition]:
    return await session.get(AppDefinition, app_id)


async def get_app_by_slug(session: AsyncSession, slug: str) -> Optional[AppDefinition]:
    result = await session.execute(
        select(AppDefinition).where(AppDefinition.slug == slug)
    )
    return result.scalar_one_or_none()


# --- Roles ---

async def assign_role(
    session: AsyncSession, app_id: int, data: AppRoleConfigCreate
) -> AppRoleConfig:
    app_def = await session.get(AppDefinition, app_id)
    if not app_def or app_def.baja_logica:
        raise ValueError("Aplicación no encontrada o dada de baja")

    existing = await session.execute(
        select(AppRoleConfig).where(
            AppRoleConfig.app_definition_id == app_id,
            AppRoleConfig.id_role == data.id_role,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"El rol '{data.id_role}' ya está asignado a esta aplicación")

    role_config = AppRoleConfig(
        app_definition_id=app_id,
        id_role=data.id_role,
        role_nombre=data.role_nombre,
    )
    session.add(role_config)
    await session.flush()
    await session.refresh(role_config)
    return role_config


async def list_app_roles(session: AsyncSession, app_id: int) -> List[AppRoleConfig]:
    result = await session.execute(
        select(AppRoleConfig).where(AppRoleConfig.app_definition_id == app_id)
    )
    return list(result.scalars().all())


async def remove_role(session: AsyncSession, role_config_id: int) -> None:
    rc = await session.get(AppRoleConfig, role_config_id)
    if not rc:
        raise ValueError("Configuración de rol no encontrada")
    await session.delete(rc)
    await session.flush()


# --- Modules ---

async def set_role_modules(
    session: AsyncSession, role_config_id: int, modules: List[AppRoleModuleCreate]
) -> List[AppRoleModule]:
    rc = await session.get(AppRoleConfig, role_config_id)
    if not rc:
        raise ValueError("Configuración de rol no encontrada")

    # Eliminar módulos existentes
    existing = await session.execute(
        select(AppRoleModule).where(AppRoleModule.app_role_config_id == role_config_id)
    )
    for m in existing.scalars().all():
        await session.delete(m)
    await session.flush()

    # Insertar nuevos
    new_modules = []
    for mod_data in modules:
        mod = AppRoleModule(
            app_role_config_id=role_config_id,
            backend_service_id=mod_data.backend_service_id,
            endpoint_path=mod_data.endpoint_path,
            metodo=mod_data.metodo,
            is_enabled=mod_data.is_enabled,
        )
        session.add(mod)
        new_modules.append(mod)

    await session.flush()
    for m in new_modules:
        await session.refresh(m)
    return new_modules


async def get_role_modules(
    session: AsyncSession, role_config_id: int
) -> List[AppRoleModule]:
    result = await session.execute(
        select(AppRoleModule).where(AppRoleModule.app_role_config_id == role_config_id)
    )
    return list(result.scalars().all())


# --- Menu ---

async def save_menu(
    session: AsyncSession, app_id: int, data: AppMenuConfigUpdate
) -> AppMenuConfig:
    existing = await session.execute(
        select(AppMenuConfig).where(AppMenuConfig.app_definition_id == app_id)
    )
    menu_cfg = existing.scalar_one_or_none()

    structure = [item.model_dump() for item in data.menu_structure]

    if menu_cfg:
        menu_cfg.menu_structure = structure
    else:
        menu_cfg = AppMenuConfig(
            app_definition_id=app_id,
            menu_structure=structure,
        )
        session.add(menu_cfg)

    await session.flush()
    await session.refresh(menu_cfg)
    return menu_cfg


async def get_menu(session: AsyncSession, app_id: int) -> Optional[AppMenuConfig]:
    result = await session.execute(
        select(AppMenuConfig).where(AppMenuConfig.app_definition_id == app_id)
    )
    return result.scalar_one_or_none()


async def auto_generate_menu(session: AsyncSession, app_id: int) -> AppMenuConfig:
    """Genera automáticamente el menú a partir de los módulos habilitados de todos los roles."""
    app_def = await session.get(AppDefinition, app_id)
    if not app_def or app_def.baja_logica:
        raise ValueError("Aplicación no encontrada o dada de baja")

    roles = await list_app_roles(session, app_id)
    service_endpoints: Dict[str, Dict[str, Any]] = {}

    for role in roles:
        modules = await get_role_modules(session, role.id)
        for mod in modules:
            if not mod.is_enabled:
                continue
            svc_id = mod.backend_service_id
            if svc_id not in service_endpoints:
                svc = await session.get(BackendService, svc_id)
                svc_name = svc.nombre if svc else svc_id
                service_endpoints[svc_id] = {
                    "nombre": svc_name,
                    "endpoints": {},
                }
            ep_key = f"{mod.metodo}:{mod.endpoint_path}"
            if ep_key not in service_endpoints[svc_id]["endpoints"]:
                # Buscar configuración UI del mapping original
                mapping_result = await session.execute(
                    select(BackendMapping).where(
                        BackendMapping.backend_service_id == svc_id,
                        BackendMapping.endpoint_path == mod.endpoint_path,
                        BackendMapping.metodo == mod.metodo,
                    ).limit(1)
                )
                mapping = mapping_result.scalar_one_or_none()
                label = (
                    mapping.configuracion_ui.get("label", f"{mod.metodo.upper()} {mod.endpoint_path}")
                    if mapping and mapping.configuracion_ui
                    else f"{mod.metodo.upper()} {mod.endpoint_path}"
                )
                service_endpoints[svc_id]["endpoints"][ep_key] = {
                    "path": mod.endpoint_path,
                    "method": mod.metodo,
                    "label": label,
                }

    menu_items: List[Dict] = []
    icon_map = {
        "usuario": "bi-people",
        "roles": "bi-shield-lock",
        "aplicacion": "bi-app-indicator",
        "pais": "bi-globe",
        "provincia": "bi-geo-alt",
        "localidad": "bi-pin-map",
        "corporacion": "bi-building",
        "empresa": "bi-briefcase",
    }

    for idx, (svc_id, svc_data) in enumerate(service_endpoints.items()):
        children = []
        for ep_idx, ep_info in enumerate(svc_data["endpoints"].values()):
            children.append({
                "id": f"item-{idx}-{ep_idx}",
                "label": ep_info["label"],
                "icon": "bi-circle",
                "order": ep_idx,
                "target_service_id": svc_id,
                "target_endpoint_path": ep_info["path"],
                "target_endpoint_method": ep_info["method"],
                "children": [],
            })

        svc_icon = "bi-box"
        for key, icon in icon_map.items():
            if key in svc_id.lower():
                svc_icon = icon
                break

        menu_items.append({
            "id": f"item-{idx}",
            "label": svc_data["nombre"],
            "icon": svc_icon,
            "order": idx,
            "children": children,
        })

    menu_update = AppMenuConfigUpdate(
        menu_structure=[MenuItemSchema(**item) for item in menu_items]
    )
    return await save_menu(session, app_id, menu_update)


# --- Access Check ---

async def check_app_access(session: AsyncSession, app_id: int) -> AppAccessCheckResponse:
    app_def = await session.get(AppDefinition, app_id)
    issues: List[AppAccessIssue] = []

    if not app_def:
        issues.append(AppAccessIssue(
            code="APP_NOT_FOUND",
            severity="error",
            message="La aplicación no existe en el sistema.",
            suggestion="Verifique que el ID de la aplicación sea correcto o cree una nueva aplicación.",
        ))
        return AppAccessCheckResponse(
            can_access=False, app_active=False, has_roles=False,
            has_modules=False, has_menu=False, issues=issues,
        )

    app_active = app_def.is_active and not app_def.baja_logica

    if app_def.baja_logica:
        issues.append(AppAccessIssue(
            code="APP_DELETED",
            severity="error",
            message="La aplicación fue dada de baja lógica.",
            suggestion="Reactive la aplicación antes de intentar acceder.",
        ))
    elif not app_def.is_active:
        issues.append(AppAccessIssue(
            code="APP_INACTIVE",
            severity="error",
            message="La aplicación está marcada como inactiva.",
            suggestion="Active la aplicación desde la pestaña 'Información'.",
        ))

    roles = await list_app_roles(session, app_id)
    has_roles = len(roles) > 0
    total_roles = len(roles)

    if not has_roles:
        issues.append(AppAccessIssue(
            code="NO_ROLES",
            severity="error",
            message="La aplicación no tiene roles asignados.",
            suggestion="Vaya a la pestaña 'Roles' y asigne al menos un rol a la aplicación.",
        ))

    total_modules = 0
    for role in roles:
        modules = await get_role_modules(session, role.id)
        enabled = [m for m in modules if m.is_enabled]
        total_modules += len(enabled)

    has_modules = total_modules > 0
    if has_roles and not has_modules:
        issues.append(AppAccessIssue(
            code="NO_MODULES",
            severity="warning",
            message="Los roles asignados no tienen módulos (endpoints) configurados.",
            suggestion="Vaya a la pestaña 'Módulos por Rol' y asigne endpoints a los roles.",
        ))

    menu_cfg = await get_menu(session, app_id)
    has_menu = menu_cfg is not None and bool(menu_cfg.menu_structure)
    menu_items_count = len(menu_cfg.menu_structure) if menu_cfg and menu_cfg.menu_structure else 0

    if not has_menu:
        issues.append(AppAccessIssue(
            code="NO_MENU",
            severity="warning",
            message="La aplicación no tiene un menú configurado.",
            suggestion="Vaya a la pestaña 'Menú' y configure la estructura del menú o use 'Auto-generar'.",
        ))

    can_access = app_active and has_roles
    return AppAccessCheckResponse(
        can_access=can_access,
        app_active=app_active,
        has_roles=has_roles,
        has_modules=has_modules,
        has_menu=has_menu,
        total_roles=total_roles,
        total_modules=total_modules,
        menu_items_count=menu_items_count,
        issues=issues,
    )


# --- Runtime ---

async def get_runtime_config(
    session: AsyncSession, app_id: int, role_id: str
) -> AppRuntimeResponse:
    app_def = await session.get(AppDefinition, app_id)
    if not app_def or app_def.baja_logica or not app_def.is_active:
        raise ValueError("Aplicación no encontrada, inactiva o dada de baja")

    role_result = await session.execute(
        select(AppRoleConfig).where(
            AppRoleConfig.app_definition_id == app_id,
            AppRoleConfig.id_role == role_id,
        )
    )
    role_config = role_result.scalar_one_or_none()
    if not role_config:
        raise ValueError(f"El rol '{role_id}' no está asignado a esta aplicación")

    modules_result = await session.execute(
        select(AppRoleModule).where(
            AppRoleModule.app_role_config_id == role_config.id,
            AppRoleModule.is_enabled == True,
        )
    )
    role_modules = modules_result.scalars().all()

    runtime_modules: List[RuntimeModuleInfo] = []
    for mod in role_modules:
        svc = await session.get(BackendService, mod.backend_service_id)
        mapping_result = await session.execute(
            select(BackendMapping).where(
                BackendMapping.backend_service_id == mod.backend_service_id,
                BackendMapping.endpoint_path == mod.endpoint_path,
                BackendMapping.metodo == mod.metodo,
            ).limit(1)
        )
        mapping = mapping_result.scalar_one_or_none()
        config_ui = mapping.configuracion_ui if mapping else {}

        runtime_modules.append(RuntimeModuleInfo(
            backend_service_id=mod.backend_service_id,
            backend_service_nombre=svc.nombre if svc else None,
            backend_service_host=svc.host if svc else None,
            backend_service_puerto=svc.puerto if svc else None,
            endpoint_path=mod.endpoint_path,
            metodo=mod.metodo,
            configuracion_ui=config_ui,
        ))

    menu_cfg = await get_menu(session, app_id)
    menu_structure = menu_cfg.menu_structure if menu_cfg else []

    if not runtime_modules and menu_structure:
        seen: set = set()
        for item in menu_structure:
            for child in (item.get("children") or []):
                sid = child.get("target_service_id") or child.get("targetServiceId")
                path = child.get("target_endpoint_path") or child.get("targetEndpointPath")
                method = (child.get("target_endpoint_method") or child.get("targetEndpointMethod") or "").upper()
                if not sid or not path:
                    continue
                key = (sid, path, method)
                if key in seen:
                    continue
                seen.add(key)
                svc = await session.get(BackendService, sid)
                if not svc:
                    continue
                m_upper = (method or "GET").upper()
                m_lower = m_upper.lower()
                mapping_result = await session.execute(
                    select(BackendMapping).where(
                        BackendMapping.backend_service_id == sid,
                        BackendMapping.endpoint_path == path,
                        or_(BackendMapping.metodo == m_upper, BackendMapping.metodo == m_lower),
                    ).limit(1)
                )
                mapping = mapping_result.scalar_one_or_none()
                config_ui = mapping.configuracion_ui if mapping else {}
                runtime_modules.append(RuntimeModuleInfo(
                    backend_service_id=sid,
                    backend_service_nombre=svc.nombre,
                    backend_service_host=svc.host,
                    backend_service_puerto=svc.puerto,
                    endpoint_path=path,
                    metodo=m_upper,
                    configuracion_ui=config_ui,
                ))

    return AppRuntimeResponse(
        app_id=app_def.id,
        app_nombre=app_def.nombre,
        app_slug=app_def.slug,
        role_id=role_id,
        role_nombre=role_config.role_nombre,
        menu_structure=menu_structure,
        modules=runtime_modules,
    )
