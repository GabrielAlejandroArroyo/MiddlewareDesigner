from typing import List, Optional, Union
from datetime import datetime
from sqlalchemy import select, update as sqlalchemy_update, delete as sqlalchemy_delete
from config.database import AsyncSessionLocal
from entity.pais_model import PaisModel
from dto.pais_create_dto import PaisCreateDTO
from dto.pais_update_dto import PaisUpdateDTO
from dto.pais_put_dto import PaisPutDTO
from dto.pais_read_dto import PaisReadDTO, PaisListDTO
from dto.pais_delete_dto import PaisDeleteDTO

async def get_all_paises(include_baja_logica: bool = True) -> PaisListDTO:
    async with AsyncSessionLocal() as session:
        query = select(PaisModel)
        if not include_baja_logica:
            query = query.where(PaisModel.baja_logica == False)
        
        result = await session.execute(query)
        paises_entities = result.scalars().all()
        
        paises_dtos = [PaisReadDTO.model_validate(p) for p in paises_entities]
        return PaisListDTO(
            pais=paises_dtos,
            total=len(paises_dtos)
        )

async def get_pais_by_id(pais_id: str) -> Optional[PaisReadDTO]:
    async with AsyncSessionLocal() as session:
        query = select(PaisModel).where(PaisModel.id == pais_id)
        result = await session.execute(query)
        pais = result.scalar_one_or_none()
        return PaisReadDTO.model_validate(pais) if pais else None

async def create_pais(pais_data: PaisCreateDTO) -> PaisReadDTO:
    async with AsyncSessionLocal() as session:
        now = datetime.utcnow()
        nuevo_pais = PaisModel(
            id=pais_data.id,
            descripcion=pais_data.descripcion,
            sigla_pais=pais_data.sigla_pais,
            fecha_alta_creacion=now,
            fecha_alta_modificacion=now
        )
        session.add(nuevo_pais)
        await session.commit()
        await session.refresh(nuevo_pais)
        return PaisReadDTO.model_validate(nuevo_pais)

async def update_pais(pais_id: str, pais_data: Union[PaisPutDTO, PaisUpdateDTO]) -> PaisReadDTO:
    async with AsyncSessionLocal() as session:
        update_data = pais_data.model_dump(exclude_unset=True)
        update_data['fecha_alta_modificacion'] = datetime.utcnow()
        
        stmt = (
            sqlalchemy_update(PaisModel)
            .where(PaisModel.id == pais_id)
            .values(**update_data)
        )
        await session.execute(stmt)
        await session.commit()
        
        # Retornar el objeto actualizado
        return await get_pais_by_id(pais_id)

async def delete_pais(pais_id: str) -> PaisDeleteDTO:
    async with AsyncSessionLocal() as session:
        # Verificar si existe
        query = select(PaisModel).where(PaisModel.id == pais_id)
        check = await session.execute(query)
        if not check.scalar_one_or_none():
            return PaisDeleteDTO(id=pais_id, success=False, mensaje="No encontrado")

        stmt = sqlalchemy_delete(PaisModel).where(PaisModel.id == pais_id)
        await session.execute(stmt)
        await session.commit()
        
        return PaisDeleteDTO(
            id=pais_id,
            success=True,
            mensaje=f"País '{pais_id}' eliminado físicamente de la base de datos"
        )

async def baja_logica_pais(pais_id: str) -> PaisReadDTO:
    async with AsyncSessionLocal() as session:
        stmt = (
            sqlalchemy_update(PaisModel)
            .where(PaisModel.id == pais_id)
            .values(baja_logica=True, fecha_alta_modificacion=datetime.utcnow())
        )
        await session.execute(stmt)
        await session.commit()
        return await get_pais_by_id(pais_id)

async def alta_logica_pais(pais_id: str) -> PaisReadDTO:
    async with AsyncSessionLocal() as session:
        stmt = (
            sqlalchemy_update(PaisModel)
            .where(PaisModel.id == pais_id)
            .values(baja_logica=False, fecha_alta_modificacion=datetime.utcnow())
        )
        await session.execute(stmt)
        await session.commit()
        return await get_pais_by_id(pais_id)
