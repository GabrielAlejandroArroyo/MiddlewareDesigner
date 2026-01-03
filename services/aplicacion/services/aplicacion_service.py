from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
from datetime import datetime

from config.database import AsyncSessionLocal
from entity.aplicacion_model import AplicacionModel
from dto.aplicacion_create_dto import AplicacionCreateDTO
from dto.aplicacion_read_dto import AplicacionReadDTO, AplicacionListDTO
from dto.aplicacion_update_dto import AplicacionUpdateDTO
from dto.aplicacion_put_dto import AplicacionPutDTO
from dto.aplicacion_delete_dto import AplicacionDeleteDTO

async def get_all_aplicaciones(include_baja_logica: bool = True) -> AplicacionListDTO:
    async with AsyncSessionLocal() as session:
        query = select(AplicacionModel)
        if not include_baja_logica:
            query = query.where(AplicacionModel.baja_logica == False)
        
        result = await session.execute(query)
        aplicaciones = result.scalars().all()
        
        total_query = select(func.count(AplicacionModel.id))
        if not include_baja_logica:
            total_query = total_query.where(AplicacionModel.baja_logica == False)
        total = await session.scalar(total_query)

        dtos = [AplicacionReadDTO.model_validate(app) for app in aplicaciones]
        return AplicacionListDTO(aplicacion=dtos, total=total if total is not None else 0)

async def get_aplicacion_by_id(aplicacion_id: str) -> Optional[AplicacionReadDTO]:
    async with AsyncSessionLocal() as session:
        aplicacion = await session.get(AplicacionModel, aplicacion_id)
        if aplicacion:
            return AplicacionReadDTO.model_validate(aplicacion)
        return None

async def create_aplicacion(aplicacion_data: AplicacionCreateDTO) -> AplicacionReadDTO:
    async with AsyncSessionLocal() as session:
        new_app = AplicacionModel(
            id=aplicacion_data.id,
            descripcion=aplicacion_data.descripcion,
            baja_logica=False,
            fecha_alta_creacion=datetime.utcnow(),
            fecha_alta_modificacion=None
        )
        session.add(new_app)
        await session.commit()
        await session.refresh(new_app)
        return AplicacionReadDTO.model_validate(new_app)

async def update_aplicacion(aplicacion_id: str, aplicacion_data: Union[AplicacionUpdateDTO, AplicacionPutDTO]) -> AplicacionReadDTO:
    async with AsyncSessionLocal() as session:
        aplicacion = await session.get(AplicacionModel, aplicacion_id)
        if not aplicacion:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Aplicación no encontrada")

        update_data = aplicacion_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(aplicacion, key, value)
        
        aplicacion.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(aplicacion)
        return AplicacionReadDTO.model_validate(aplicacion)

async def delete_aplicacion(aplicacion_id: str) -> AplicacionDeleteDTO:
    async with AsyncSessionLocal() as session:
        aplicacion = await session.get(AplicacionModel, aplicacion_id)
        if not aplicacion:
            return AplicacionDeleteDTO(id=aplicacion_id, success=False, mensaje="Aplicación no encontrada")
        
        await session.delete(aplicacion)
        await session.commit()
        return AplicacionDeleteDTO(id=aplicacion_id, success=True, mensaje="Aplicación eliminada definitivamente")

async def baja_logica_aplicacion(aplicacion_id: str) -> AplicacionReadDTO:
    async with AsyncSessionLocal() as session:
        aplicacion = await session.get(AplicacionModel, aplicacion_id)
        if not aplicacion:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Aplicación no encontrada")
        
        aplicacion.baja_logica = True
        aplicacion.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(aplicacion)
        return AplicacionReadDTO.model_validate(aplicacion)

async def alta_logica_aplicacion(aplicacion_id: str) -> AplicacionReadDTO:
    async with AsyncSessionLocal() as session:
        aplicacion = await session.get(AplicacionModel, aplicacion_id)
        if not aplicacion:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Aplicación no encontrada")
        
        aplicacion.baja_logica = False
        aplicacion.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(aplicacion)
        return AplicacionReadDTO.model_validate(aplicacion)
