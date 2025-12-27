import httpx
from typing import List, Optional, Union, Dict
from datetime import datetime
from sqlalchemy import select, update as sqlalchemy_update, delete as sqlalchemy_delete
from config.database import AsyncSessionLocal
from entity.localidad_model import LocalidadModel
from dto.localidad_create_dto import LocalidadCreateDTO
from dto.localidad_update_dto import LocalidadUpdateDTO
from dto.localidad_put_dto import LocalidadPutDTO
from dto.localidad_read_dto import LocalidadReadDTO, LocalidadListDTO
from dto.localidad_delete_dto import LocalidadDeleteDTO

# URLs de los microservicios para validación
PAIS_SERVICE_URL = "http://localhost:8000/api/v1/paises"
PROVINCIA_SERVICE_URL = "http://localhost:8001/api/v1/provincias"

async def validar_pais_existe(id_pais: str) -> bool:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{PAIS_SERVICE_URL}/{id_pais}")
            return response.status_code == 200
        except Exception:
            return False

async def validar_provincia_existe(id_provincia: str) -> bool:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{PROVINCIA_SERVICE_URL}/{id_provincia}")
            return response.status_code == 200
        except Exception:
            return False

async def get_all_localidades(
    include_baja_logica: bool = True, 
    id_pais: Optional[str] = None, 
    id_provincia: Optional[str] = None
) -> LocalidadListDTO:
    async with AsyncSessionLocal() as session:
        query = select(LocalidadModel)
        
        if not include_baja_logica:
            query = query.where(LocalidadModel.baja_logica == False)
        
        if id_pais:
            query = query.where(LocalidadModel.id_pais == id_pais)
            
        if id_provincia:
            query = query.where(LocalidadModel.id_provincia == id_provincia)
        
        result = await session.execute(query)
        localidades = result.scalars().all()
        
        dtos = [LocalidadReadDTO.model_validate(l) for l in localidades]
        return LocalidadListDTO(
            localidades=dtos,
            total=len(dtos)
        )

async def get_localidad_by_id(localidad_id: str) -> Optional[LocalidadReadDTO]:
    async with AsyncSessionLocal() as session:
        query = select(LocalidadModel).where(LocalidadModel.id == localidad_id)
        result = await session.execute(query)
        localidad = result.scalar_one_or_none()
        return LocalidadReadDTO.model_validate(localidad) if localidad else None

async def create_localidad(localidad_data: LocalidadCreateDTO) -> LocalidadReadDTO:
    # Validaciones de existencia
    if not await validar_pais_existe(localidad_data.id_pais):
        raise ValueError(f"El país con ID '{localidad_data.id_pais}' no existe.")
    
    if not await validar_provincia_existe(localidad_data.id_provincia):
        raise ValueError(f"La provincia con ID '{localidad_data.id_provincia}' no existe.")

    async with AsyncSessionLocal() as session:
        now = datetime.utcnow()
        nueva_localidad = LocalidadModel(
            id=localidad_data.id,
            descripcion=localidad_data.descripcion,
            id_pais=localidad_data.id_pais,
            id_provincia=localidad_data.id_provincia,
            fecha_alta_creacion=now,
            fecha_alta_modificacion=now
        )
        session.add(nueva_localidad)
        await session.commit()
        await session.refresh(nueva_localidad)
        return LocalidadReadDTO.model_validate(nueva_localidad)

async def update_localidad(localidad_id: str, localidad_data: Union[LocalidadPutDTO, LocalidadUpdateDTO]) -> LocalidadReadDTO:
    async with AsyncSessionLocal() as session:
        update_data = localidad_data.model_dump(exclude_unset=True)
        
        # Validar país si se intenta cambiar
        if 'id_pais' in update_data and not await validar_pais_existe(update_data['id_pais']):
             raise ValueError(f"El país con ID '{update_data['id_pais']}' no existe.")
             
        # Validar provincia si se intenta cambiar
        if 'id_provincia' in update_data and not await validar_provincia_existe(update_data['id_provincia']):
             raise ValueError(f"La provincia con ID '{update_data['id_provincia']}' no existe.")

        update_data['fecha_alta_modificacion'] = datetime.utcnow()
        
        stmt = (
            sqlalchemy_update(LocalidadModel)
            .where(LocalidadModel.id == localidad_id)
            .values(**update_data)
        )
        await session.execute(stmt)
        await session.commit()
        return await get_localidad_by_id(localidad_id)

async def delete_localidad(localidad_id: str) -> LocalidadDeleteDTO:
    async with AsyncSessionLocal() as session:
        query = select(LocalidadModel).where(LocalidadModel.id == localidad_id)
        check = await session.execute(query)
        if not check.scalar_one_or_none():
            return LocalidadDeleteDTO(id=localidad_id, success=False, mensaje="Localidad no encontrada")

        stmt = sqlalchemy_delete(LocalidadModel).where(LocalidadModel.id == localidad_id)
        await session.execute(stmt)
        await session.commit()
        return LocalidadDeleteDTO(id=localidad_id, success=True, mensaje="Localidad eliminada físicamente")

async def baja_logica_localidad(localidad_id: str) -> LocalidadReadDTO:
    async with AsyncSessionLocal() as session:
        stmt = (
            sqlalchemy_update(LocalidadModel)
            .where(LocalidadModel.id == localidad_id)
            .values(baja_logica=True, fecha_alta_modificacion=datetime.utcnow())
        )
        await session.execute(stmt)
        await session.commit()
        return await get_localidad_by_id(localidad_id)

async def alta_logica_localidad(localidad_id: str) -> LocalidadReadDTO:
    async with AsyncSessionLocal() as session:
        stmt = (
            sqlalchemy_update(LocalidadModel)
            .where(LocalidadModel.id == localidad_id)
            .values(baja_logica=False, fecha_alta_modificacion=datetime.utcnow())
        )
        await session.execute(stmt)
        await session.commit()
        return await get_localidad_by_id(localidad_id)
