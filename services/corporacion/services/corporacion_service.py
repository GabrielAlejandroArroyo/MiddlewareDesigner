from typing import List, Optional, Union
from datetime import datetime
from sqlalchemy import select, update as sqlalchemy_update, delete as sqlalchemy_delete
from config.database import AsyncSessionLocal
from entity.corporacion_model import CorporacionModel
from dto.corporacion_create_dto import CorporacionCreateDTO
from dto.corporacion_update_dto import CorporacionUpdateDTO
from dto.corporacion_put_dto import CorporacionPutDTO
from dto.corporacion_read_dto import CorporacionReadDTO, CorporacionListDTO
from dto.corporacion_delete_dto import CorporacionDeleteDTO

async def get_all_corporaciones(include_baja_logica: bool = True) -> CorporacionListDTO:
    async with AsyncSessionLocal() as session:
        query = select(CorporacionModel)
        if not include_baja_logica:
            query = query.where(CorporacionModel.baja_logica == False)
        
        result = await session.execute(query)
        corporaciones_entities = result.scalars().all()
        
        corporaciones_dtos = [CorporacionReadDTO.model_validate(c) for c in corporaciones_entities]
        return CorporacionListDTO(
            corporacion=corporaciones_dtos,
            total=len(corporaciones_dtos)
        )

async def get_corporacion_by_id(corporacion_id: str) -> Optional[CorporacionReadDTO]:
    async with AsyncSessionLocal() as session:
        query = select(CorporacionModel).where(CorporacionModel.id == corporacion_id)
        result = await session.execute(query)
        corporacion = result.scalar_one_or_none()
        return CorporacionReadDTO.model_validate(corporacion) if corporacion else None

async def create_corporacion(corporacion_data: CorporacionCreateDTO) -> CorporacionReadDTO:
    async with AsyncSessionLocal() as session:
        now = datetime.utcnow()
        nueva_corporacion = CorporacionModel(
            id=corporacion_data.id,
            descripcion=corporacion_data.descripcion,
            fecha_alta_creacion=now,
            fecha_alta_modificacion=now
        )
        session.add(nueva_corporacion)
        await session.commit()
        await session.refresh(nueva_corporacion)
        return CorporacionReadDTO.model_validate(nueva_corporacion)

async def update_corporacion(corporacion_id: str, corporacion_data: Union[CorporacionPutDTO, CorporacionUpdateDTO]) -> CorporacionReadDTO:
    async with AsyncSessionLocal() as session:
        update_data = corporacion_data.model_dump(exclude_unset=True)
        update_data['fecha_alta_modificacion'] = datetime.utcnow()
        
        stmt = (
            sqlalchemy_update(CorporacionModel)
            .where(CorporacionModel.id == corporacion_id)
            .values(**update_data)
        )
        await session.execute(stmt)
        await session.commit()
        
        return await get_corporacion_by_id(corporacion_id)

async def delete_corporacion(corporacion_id: str) -> CorporacionDeleteDTO:
    async with AsyncSessionLocal() as session:
        query = select(CorporacionModel).where(CorporacionModel.id == corporacion_id)
        check = await session.execute(query)
        if not check.scalar_one_or_none():
            return CorporacionDeleteDTO(id=corporacion_id, success=False, mensaje="No encontrado")

        stmt = sqlalchemy_delete(CorporacionModel).where(CorporacionModel.id == corporacion_id)
        await session.execute(stmt)
        await session.commit()
        
        return CorporacionDeleteDTO(
            id=corporacion_id,
            success=True,
            mensaje=f"Corporación '{corporacion_id}' eliminada físicamente de la base de datos"
        )

async def baja_logica_corporacion(corporacion_id: str) -> CorporacionReadDTO:
    async with AsyncSessionLocal() as session:
        stmt = (
            sqlalchemy_update(CorporacionModel)
            .where(CorporacionModel.id == corporacion_id)
            .values(baja_logica=True, fecha_alta_modificacion=datetime.utcnow())
        )
        await session.execute(stmt)
        await session.commit()
        return await get_corporacion_by_id(corporacion_id)

async def alta_logica_corporacion(corporacion_id: str) -> CorporacionReadDTO:
    async with AsyncSessionLocal() as session:
        stmt = (
            sqlalchemy_update(CorporacionModel)
            .where(CorporacionModel.id == corporacion_id)
            .values(baja_logica=False, fecha_alta_modificacion=datetime.utcnow())
        )
        await session.execute(stmt)
        await session.commit()
        return await get_corporacion_by_id(corporacion_id)
