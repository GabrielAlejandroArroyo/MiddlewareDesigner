import httpx
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
from datetime import datetime

from shared.id_generator import generate_entity_id

from config.database import AsyncSessionLocal
from entity.aplicacion_role_model import AplicacionRoleModel
from dto.aplicacion_role_create_dto import AplicacionRoleCreateDTO
from dto.aplicacion_role_read_dto import AplicacionRoleReadDTO, AplicacionRoleListDTO
from dto.aplicacion_role_update_dto import AplicacionRoleUpdateDTO, AplicacionRolePutDTO
from dto.aplicacion_role_delete_dto import AplicacionRoleDeleteDTO

APLICACION_URL = "http://127.0.0.1:8005/api/v1/aplicaciones"
ROLES_URL = "http://127.0.0.1:8006/api/v1/roles"

async def _validate_refs(id_app: str, id_role: str):
    async with httpx.AsyncClient() as client:
        # Validar Aplicacion
        try:
            resp_app = await client.get(f"{APLICACION_URL}/{id_app}")
            if resp_app.status_code == 404:
                raise HTTPException(status_code=400, detail=f"Aplicación '{id_app}' no existe")
            resp_app.raise_for_status()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Servicio de Aplicación no disponible")

        # Validar Role
        try:
            resp_role = await client.get(f"{ROLES_URL}/{id_role}")
            if resp_role.status_code == 404:
                raise HTTPException(status_code=400, detail=f"Rol '{id_role}' no existe")
            resp_role.raise_for_status()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Servicio de Roles no disponible")


async def _is_protected_app_role_link(id_aplicacion: str, id_role: str) -> bool:
    """Verifica si es el vínculo protegido MIDDLEWARE-Administrador."""
    async with httpx.AsyncClient() as client:
        try:
            resp_app = await client.get(f"{APLICACION_URL}/{id_aplicacion}")
            if resp_app.status_code != 200:
                return False
            app_data = resp_app.json()
            if app_data.get("tipo") != "MIDDLEWARE":
                return False
            resp_role = await client.get(f"{ROLES_URL}/{id_role}")
            if resp_role.status_code != 200:
                return False
            role_data = resp_role.json()
            return (
                role_data.get("descripcion") == "Administrador"
                and role_data.get("id_aplicacion") == id_aplicacion
            )
        except (httpx.RequestError, KeyError):
            return False


async def get_all(include_baja: bool = True) -> AplicacionRoleListDTO:
    async with AsyncSessionLocal() as session:
        query = select(AplicacionRoleModel)
        if not include_baja:
            query = query.where(AplicacionRoleModel.baja_logica == False)
        
        result = await session.execute(query)
        items = result.scalars().all()
        
        total = await session.scalar(select(func.count(AplicacionRoleModel.id)))
        
        dtos = [AplicacionRoleReadDTO.model_validate(i) for i in items]
        return AplicacionRoleListDTO(aplicacion_roles=dtos, total=total or 0)

async def get_by_id(id: str) -> Optional[AplicacionRoleReadDTO]:
    async with AsyncSessionLocal() as session:
        item = await session.get(AplicacionRoleModel, id)
        if item:
            return AplicacionRoleReadDTO.model_validate(item)
        return None

async def create(data: AplicacionRoleCreateDTO) -> AplicacionRoleReadDTO:
    await _validate_refs(data.id_aplicacion, data.id_role)
    
    async with AsyncSessionLocal() as session:
        # Verificar duplicado de clave unica (app + role)
        dup_query = select(AplicacionRoleModel).where(
            AplicacionRoleModel.id_aplicacion == data.id_aplicacion,
            AplicacionRoleModel.id_role == data.id_role
        )
        dup = await session.execute(dup_query)
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Ya existe un vínculo para esta aplicación y rol")

        now = datetime.utcnow()
        link_id = data.id or generate_entity_id("APRL")
        new_item = AplicacionRoleModel(
            id=link_id,
            id_aplicacion=data.id_aplicacion,
            id_role=data.id_role,
            baja_logica=False,
            fecha_alta_creacion=now,
            fecha_alta_modificacion=now
        )
        session.add(new_item)
        await session.commit()
        await session.refresh(new_item)
        return AplicacionRoleReadDTO.model_validate(new_item)

async def update(id: str, data: Union[AplicacionRoleUpdateDTO, AplicacionRolePutDTO]) -> AplicacionRoleReadDTO:
    async with AsyncSessionLocal() as session:
        item = await session.get(AplicacionRoleModel, id)
        if not item:
            raise HTTPException(status_code=404, detail="Vínculo no encontrado")

        update_data = data.model_dump(exclude_unset=True)
        
        # Si se cambia app o role, validar refs y unicidad
        new_app = update_data.get('id_aplicacion', item.id_aplicacion)
        new_role = update_data.get('id_role', item.id_role)
        
        if new_app != item.id_aplicacion or new_role != item.id_role:
            await _validate_refs(new_app, new_role)
            dup_query = select(AplicacionRoleModel).where(
                AplicacionRoleModel.id_aplicacion == new_app,
                AplicacionRoleModel.id_role == new_role,
                AplicacionRoleModel.id != id
            )
            dup = await session.execute(dup_query)
            if dup.scalar_one_or_none():
                raise HTTPException(status_code=409, detail="Ya existe otro vínculo para esta aplicación y rol")

        for key, value in update_data.items():
            setattr(item, key, value)
        
        item.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(item)
        return AplicacionRoleReadDTO.model_validate(item)

async def delete(id: str) -> AplicacionRoleDeleteDTO:
    async with AsyncSessionLocal() as session:
        item = await session.get(AplicacionRoleModel, id)
        if not item:
            return AplicacionRoleDeleteDTO(id=id, success=False, mensaje="No encontrado")
        if await _is_protected_app_role_link(item.id_aplicacion, item.id_role):
            return AplicacionRoleDeleteDTO(id=id, success=False, mensaje="No se puede eliminar el vínculo MIDDLEWARE-Administrador (entidad protegida)")

        await session.delete(item)
        await session.commit()
        return AplicacionRoleDeleteDTO(id=id, success=True, mensaje="Eliminado correctamente")

async def toggle_baja(id: str, state: bool) -> AplicacionRoleReadDTO:
    async with AsyncSessionLocal() as session:
        item = await session.get(AplicacionRoleModel, id)
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        if state and await _is_protected_app_role_link(item.id_aplicacion, item.id_role):
            raise HTTPException(status_code=400, detail="No se puede dar de baja el vínculo MIDDLEWARE-Administrador (entidad protegida)")

        item.baja_logica = state
        item.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(item)
        return AplicacionRoleReadDTO.model_validate(item)
