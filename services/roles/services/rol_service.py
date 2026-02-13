import httpx
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
from datetime import datetime

from shared.id_generator import generate_entity_id

from config.database import AsyncSessionLocal
from entity.rol_model import RolModel
from dto.rol_create_dto import RolCreateDTO
from dto.rol_read_dto import RolReadDTO, RolListDTO
from dto.rol_update_dto import RolUpdateDTO
from dto.rol_put_dto import RolPutDTO
from dto.rol_delete_dto import RolDeleteDTO

APLICACION_SERVICE_URL = "http://localhost:8005/api/v1/aplicaciones"

async def _check_aplicacion_exists(aplicacion_id: str) -> bool:
    """Verifica si la aplicación existe en el microservicio de Aplicación."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{APLICACION_SERVICE_URL}/{aplicacion_id}")
            response.raise_for_status()
            return True
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return False
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al consultar servicio de Aplicación: {e}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Servicio de Aplicación no disponible en el puerto 8005: {e}")


async def _is_aplicacion_middleware(aplicacion_id: str) -> bool:
    """Verifica si la aplicación es de tipo MIDDLEWARE."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{APLICACION_SERVICE_URL}/{aplicacion_id}")
            if response.status_code != 200:
                return False
            data = response.json()
            return data.get("tipo") == "MIDDLEWARE"
        except (httpx.RequestError, KeyError):
            return False

async def get_all_roles(include_baja_logica: bool = True) -> RolListDTO:
    async with AsyncSessionLocal() as session:
        query = select(RolModel)
        if not include_baja_logica:
            query = query.where(RolModel.baja_logica == False)
        
        result = await session.execute(query)
        roles = result.scalars().all()
        
        total_query = select(func.count(RolModel.id))
        if not include_baja_logica:
            total_query = total_query.where(RolModel.baja_logica == False)
        total = await session.scalar(total_query)

        dtos = [RolReadDTO.model_validate(rol) for rol in roles]
        return RolListDTO(roles=dtos, total=total if total is not None else 0)

async def get_rol_by_id(rol_id: str) -> Optional[RolReadDTO]:
    async with AsyncSessionLocal() as session:
        rol = await session.get(RolModel, rol_id)
        if rol:
            return RolReadDTO.model_validate(rol)
        return None

async def get_roles_by_id_aplicacion(id_aplicacion: str, include_baja_logica: bool = True) -> RolListDTO:
    """Obtiene todos los roles asociados a una aplicación específica."""
    async with AsyncSessionLocal() as session:
        query = select(RolModel).where(RolModel.id_aplicacion == id_aplicacion)
        if not include_baja_logica:
            query = query.where(RolModel.baja_logica == False)
        
        result = await session.execute(query)
        roles = result.scalars().all()
        
        total_query = select(func.count(RolModel.id)).where(RolModel.id_aplicacion == id_aplicacion)
        if not include_baja_logica:
            total_query = total_query.where(RolModel.baja_logica == False)
        total = await session.scalar(total_query)

        dtos = [RolReadDTO.model_validate(rol) for rol in roles]
        return RolListDTO(roles=dtos, total=total if total is not None else 0)

async def create_rol(rol_data: RolCreateDTO) -> RolReadDTO:
    async with AsyncSessionLocal() as session:
        # Validar existencia de Aplicación
        if not await _check_aplicacion_exists(rol_data.id_aplicacion):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"La Aplicación con ID '{rol_data.id_aplicacion}' no existe.")

        now = datetime.utcnow()
        rol_id = rol_data.id or generate_entity_id("ROLE")
        new_rol = RolModel(
            id=rol_id,
            descripcion=rol_data.descripcion,
            id_aplicacion=rol_data.id_aplicacion,
            baja_logica=False,
            fecha_alta_creacion=now,
            fecha_alta_modificacion=now
        )
        session.add(new_rol)
        await session.commit()
        await session.refresh(new_rol)
        return RolReadDTO.model_validate(new_rol)

async def update_rol(rol_id: str, rol_data: Union[RolUpdateDTO, RolPutDTO]) -> RolReadDTO:
    async with AsyncSessionLocal() as session:
        rol = await session.get(RolModel, rol_id)
        if not rol:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol no encontrado")

        # Validar existencia de Aplicación si se está actualizando
        if hasattr(rol_data, 'id_aplicacion') and rol_data.id_aplicacion is not None and rol_data.id_aplicacion != rol.id_aplicacion:
            if not await _check_aplicacion_exists(rol_data.id_aplicacion):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"La Aplicación con ID '{rol_data.id_aplicacion}' no existe.")

        update_data = rol_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(rol, key, value)
        
        rol.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(rol)
        return RolReadDTO.model_validate(rol)

async def delete_rol(rol_id: str) -> RolDeleteDTO:
    async with AsyncSessionLocal() as session:
        rol = await session.get(RolModel, rol_id)
        if not rol:
            return RolDeleteDTO(id=rol_id, success=False, mensaje="Rol no encontrado")
        if rol.descripcion == "Administrador" and await _is_aplicacion_middleware(rol.id_aplicacion):
            return RolDeleteDTO(id=rol_id, success=False, mensaje="No se puede eliminar el rol Administrador de la aplicación MIDDLEWARE (entidad protegida)")

        await session.delete(rol)
        await session.commit()
        return RolDeleteDTO(id=rol_id, success=True, mensaje="Rol eliminado definitivamente")

async def baja_logica_rol(rol_id: str) -> RolReadDTO:
    async with AsyncSessionLocal() as session:
        rol = await session.get(RolModel, rol_id)
        if not rol:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol no encontrado")
        if rol.descripcion == "Administrador" and await _is_aplicacion_middleware(rol.id_aplicacion):
            raise HTTPException(status_code=400, detail="No se puede dar de baja el rol Administrador de la aplicación MIDDLEWARE (entidad protegida)")

        rol.baja_logica = True
        rol.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(rol)
        return RolReadDTO.model_validate(rol)

async def alta_logica_rol(rol_id: str) -> RolReadDTO:
    async with AsyncSessionLocal() as session:
        rol = await session.get(RolModel, rol_id)
        if not rol:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol no encontrado")
        
        rol.baja_logica = False
        rol.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(rol)
        return RolReadDTO.model_validate(rol)
