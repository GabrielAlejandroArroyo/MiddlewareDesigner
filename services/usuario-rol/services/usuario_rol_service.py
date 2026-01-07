import httpx
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
from datetime import datetime

from config.database import AsyncSessionLocal
from entity.usuario_rol_model import UsuarioRolModel
from dto.usuario_rol_create_dto import UsuarioRolCreateDTO
from dto.usuario_rol_read_dto import UsuarioRolReadDTO, UsuarioRolListDTO
from dto.usuario_rol_update_dto import UsuarioRolUpdateDTO, UsuarioRolPutDTO
from dto.usuario_rol_delete_dto import UsuarioRolDeleteDTO

USUARIO_URL = "http://127.0.0.1:8007/api/v1/usuarios"
APLICACION_URL = "http://127.0.0.1:8005/api/v1/aplicaciones"
ROLES_URL = "http://127.0.0.1:8006/api/v1/roles"

async def _validate_refs(id_usuario: str, id_aplicacion: str, id_rol: str):
    async with httpx.AsyncClient() as client:
        # Validar Usuario
        try:
            resp_u = await client.get(f"{USUARIO_URL}/{id_usuario}")
            if resp_u.status_code == 404:
                raise HTTPException(status_code=400, detail=f"Usuario '{id_usuario}' no existe")
            resp_u.raise_for_status()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Servicio de Usuario no disponible")

        # Validar Aplicacion
        try:
            resp_a = await client.get(f"{APLICACION_URL}/{id_aplicacion}")
            if resp_a.status_code == 404:
                raise HTTPException(status_code=400, detail=f"Aplicación '{id_aplicacion}' no existe")
            resp_a.raise_for_status()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Servicio de Aplicación no disponible")

        # Validar Rol
        try:
            resp_r = await client.get(f"{ROLES_URL}/{id_rol}")
            if resp_r.status_code == 404:
                raise HTTPException(status_code=400, detail=f"Rol '{id_rol}' no existe")
            resp_r.raise_for_status()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Servicio de Roles no disponible")

async def get_all(include_baja: bool = True) -> UsuarioRolListDTO:
    async with AsyncSessionLocal() as session:
        query = select(UsuarioRolModel)
        if not include_baja:
            query = query.where(UsuarioRolModel.baja_logica == False)
        
        result = await session.execute(query)
        items = result.scalars().all()
        
        total = await session.scalar(select(func.count(UsuarioRolModel.internal_id)))
        
        dtos = [UsuarioRolReadDTO.model_validate(i) for i in items]
        return UsuarioRolListDTO(usuario_roles=dtos, total=total or 0)

async def get_by_internal_id(internal_id: int) -> Optional[UsuarioRolReadDTO]:
    async with AsyncSessionLocal() as session:
        item = await session.get(UsuarioRolModel, internal_id)
        if item:
            return UsuarioRolReadDTO.model_validate(item)
        return None

async def create(data: UsuarioRolCreateDTO) -> UsuarioRolReadDTO:
    await _validate_refs(data.id_usuario, data.id_aplicacion, data.id_rol)
    
    async with AsyncSessionLocal() as session:
        # Verificar duplicado (usuario + aplicacion + rol)
        dup_query = select(UsuarioRolModel).where(
            UsuarioRolModel.id_usuario == data.id_usuario,
            UsuarioRolModel.id_aplicacion == data.id_aplicacion,
            UsuarioRolModel.id_rol == data.id_rol
        )
        dup = await session.execute(dup_query)
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Ya existe un vínculo para este usuario, aplicación y rol")

        now = datetime.utcnow()
        new_item = UsuarioRolModel(
            id=data.id,
            id_usuario=data.id_usuario,
            id_aplicacion=data.id_aplicacion,
            id_rol=data.id_rol,
            baja_logica=False,
            fecha_alta_creacion=now,
            fecha_alta_modificacion=now
        )
        session.add(new_item)
        await session.commit()
        await session.refresh(new_item)
        return UsuarioRolReadDTO.model_validate(new_item)

async def update(internal_id: int, data: Union[UsuarioRolUpdateDTO, UsuarioRolPutDTO]) -> UsuarioRolReadDTO:
    async with AsyncSessionLocal() as session:
        item = await session.get(UsuarioRolModel, internal_id)
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")

        update_data = data.model_dump(exclude_unset=True)
        
        new_u = update_data.get('id_usuario', item.id_usuario)
        new_a = update_data.get('id_aplicacion', item.id_aplicacion)
        new_r = update_data.get('id_rol', item.id_rol)
        
        if new_u != item.id_usuario or new_a != item.id_aplicacion or new_r != item.id_rol:
            await _validate_refs(new_u, new_a, new_r)
            dup_query = select(UsuarioRolModel).where(
                UsuarioRolModel.id_usuario == new_u,
                UsuarioRolModel.id_aplicacion == new_a,
                UsuarioRolModel.id_rol == new_r,
                UsuarioRolModel.internal_id != internal_id
            )
            dup = await session.execute(dup_query)
            if dup.scalar_one_or_none():
                raise HTTPException(status_code=409, detail="Ya existe otro vínculo para esta combinación")

        for key, value in update_data.items():
            setattr(item, key, value)
        
        item.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(item)
        return UsuarioRolReadDTO.model_validate(item)

async def delete(internal_id: int) -> UsuarioRolDeleteDTO:
    async with AsyncSessionLocal() as session:
        item = await session.get(UsuarioRolModel, internal_id)
        if not item:
            return UsuarioRolDeleteDTO(internal_id=internal_id, success=False, mensaje="No encontrado")
        
        await session.delete(item)
        await session.commit()
        return UsuarioRolDeleteDTO(internal_id=internal_id, success=True, mensaje="Eliminado")

async def toggle_baja(internal_id: int, state: bool) -> UsuarioRolReadDTO:
    async with AsyncSessionLocal() as session:
        item = await session.get(UsuarioRolModel, internal_id)
        if not item:
            raise HTTPException(status_code=404, detail="No encontrado")
        
        item.baja_logica = state
        item.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(item)
        return UsuarioRolReadDTO.model_validate(item)
