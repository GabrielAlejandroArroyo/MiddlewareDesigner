import httpx
from typing import List, Optional, Union, Dict
from datetime import datetime
from sqlalchemy import select, update as sqlalchemy_update, delete as sqlalchemy_delete
from config.database import AsyncSessionLocal
from entity.provincia_model import ProvinciaModel
from dto.provincia_create_dto import ProvinciaCreateDTO
from dto.provincia_update_dto import ProvinciaUpdateDTO
from dto.provincia_put_dto import ProvinciaPutDTO
from dto.provincia_read_dto import ProvinciaReadDTO, ProvinciaListDTO
from dto.provincia_delete_dto import ProvinciaDeleteDTO

# URL del microservicio de Pais para validación
PAIS_SERVICE_URL = "http://localhost:8000/api/v1/paises"

async def validar_pais_existe(id_pais: str) -> bool:
    """Valida la existencia del país llamando al microservicio Pais"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{PAIS_SERVICE_URL}/{id_pais}")
            return response.status_code == 200
        except Exception:
            return False

async def get_all_provincias(include_baja_logica: bool = True) -> ProvinciaListDTO:
    async with AsyncSessionLocal() as session:
        query = select(ProvinciaModel)
        if not include_baja_logica:
            query = query.where(ProvinciaModel.baja_logica == False)
        
        result = await session.execute(query)
        provincias = result.scalars().all()
        
        return ProvinciaListDTO(
            provincias=[ProvinciaReadDTO.model_validate(p) for p in provincias],
            total=len(provincias)
        )

async def get_provincia_by_id(provincia_id: str) -> Optional[ProvinciaReadDTO]:
    async with AsyncSessionLocal() as session:
        query = select(ProvinciaModel).where(ProvinciaModel.id == provincia_id)
        result = await session.execute(query)
        provincia = result.scalar_one_or_none()
        return ProvinciaReadDTO.model_validate(provincia) if provincia else None

async def create_provincia(provincia_data: ProvinciaCreateDTO) -> ProvinciaReadDTO:
    async with AsyncSessionLocal() as session:
        nueva_provincia = ProvinciaModel(
            id=provincia_data.id,
            descripcion=provincia_data.descripcion,
            id_pais=provincia_data.id_pais,
            fecha_alta_creacion=datetime.utcnow()
        )
        session.add(nueva_provincia)
        await session.commit()
        await session.refresh(nueva_provincia)
        return ProvinciaReadDTO.model_validate(nueva_provincia)

async def update_provincia(provincia_id: str, provincia_data: Union[ProvinciaPutDTO, ProvinciaUpdateDTO]) -> ProvinciaReadDTO:
    async with AsyncSessionLocal() as session:
        update_data = provincia_data.model_dump(exclude_unset=True)
        update_data['fecha_alta_modificacion'] = datetime.utcnow()
        
        stmt = (
            sqlalchemy_update(ProvinciaModel)
            .where(ProvinciaModel.id == provincia_id)
            .values(**update_data)
        )
        await session.execute(stmt)
        await session.commit()
        return await get_provincia_by_id(provincia_id)

async def delete_provincia(provincia_id: str) -> ProvinciaDeleteDTO:
    async with AsyncSessionLocal() as session:
        query = select(ProvinciaModel).where(ProvinciaModel.id == provincia_id)
        check = await session.execute(query)
        if not check.scalar_one_or_none():
            return ProvinciaDeleteDTO(id=provincia_id, success=False, mensaje="No encontrado")

        stmt = sqlalchemy_delete(ProvinciaModel).where(ProvinciaModel.id == provincia_id)
        await session.execute(stmt)
        await session.commit()
        return ProvinciaDeleteDTO(id=provincia_id, success=True, mensaje="Eliminado físicamente")

async def baja_logica_provincia(provincia_id: str) -> ProvinciaReadDTO:
    async with AsyncSessionLocal() as session:
        stmt = (
            sqlalchemy_update(ProvinciaModel)
            .where(ProvinciaModel.id == provincia_id)
            .values(baja_logica=True, fecha_alta_modificacion=datetime.utcnow())
        )
        await session.execute(stmt)
        await session.commit()
        return await get_provincia_by_id(provincia_id)

async def alta_logica_provincia(provincia_id: str) -> ProvinciaReadDTO:
    async with AsyncSessionLocal() as session:
        stmt = (
            sqlalchemy_update(ProvinciaModel)
            .where(ProvinciaModel.id == provincia_id)
            .values(baja_logica=False, fecha_alta_modificacion=datetime.utcnow())
        )
        await session.execute(stmt)
        await session.commit()
        return await get_provincia_by_id(provincia_id)
