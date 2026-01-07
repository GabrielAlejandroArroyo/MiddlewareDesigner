import httpx
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
from datetime import datetime

from config.database import AsyncSessionLocal
from entity.usuario_model import UsuarioModel
from dto.usuario_create_dto import UsuarioCreateDTO
from dto.usuario_read_dto import UsuarioReadDTO, UsuarioListDTO
from dto.usuario_update_dto import UsuarioUpdateDTO, UsuarioPutDTO
from dto.usuario_delete_dto import UsuarioDeleteDTO

async def get_all_usuarios(include_baja_logica: bool = True) -> UsuarioListDTO:
    async with AsyncSessionLocal() as session:
        query = select(UsuarioModel)
        if not include_baja_logica:
            query = query.where(UsuarioModel.baja_logica == False)
        
        result = await session.execute(query)
        usuarios = result.scalars().all()
        
        total_query = select(func.count(UsuarioModel.id))
        if not include_baja_logica:
            total_query = total_query.where(UsuarioModel.baja_logica == False)
        total = await session.scalar(total_query)

        dtos = [UsuarioReadDTO.model_validate(u) for u in usuarios]
        return UsuarioListDTO(usuarios=dtos, total=total if total is not None else 0)

async def get_usuario_by_id(usuario_id: str) -> Optional[UsuarioReadDTO]:
    async with AsyncSessionLocal() as session:
        usuario = await session.get(UsuarioModel, usuario_id)
        if usuario:
            return UsuarioReadDTO.model_validate(usuario)
        return None

async def create_usuario(usuario_data: UsuarioCreateDTO) -> UsuarioReadDTO:
    async with AsyncSessionLocal() as session:
        now = datetime.utcnow()
        new_usuario = UsuarioModel(
            id=usuario_data.id,
            email=usuario_data.email,
            nombre_usuario=usuario_data.nombre_usuario,
            nombre=usuario_data.nombre,
            apellido=usuario_data.apellido,
            baja_logica=False,
            fecha_alta_creacion=now,
            fecha_alta_modificacion=now
        )
        
        session.add(new_usuario)
        try:
            await session.commit()
            await session.refresh(new_usuario)
            return UsuarioReadDTO.model_validate(new_usuario)
        except Exception as e:
            await session.rollback()
            raise HTTPException(status_code=400, detail=f"Error al crear usuario: {str(e)}")

async def update_usuario(usuario_id: str, usuario_data: Union[UsuarioUpdateDTO, UsuarioPutDTO]) -> UsuarioReadDTO:
    async with AsyncSessionLocal() as session:
        usuario = await session.get(UsuarioModel, usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        update_data = usuario_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(usuario, key, value)
        
        usuario.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(usuario)
        return UsuarioReadDTO.model_validate(usuario)

async def delete_usuario(usuario_id: str) -> UsuarioDeleteDTO:
    async with AsyncSessionLocal() as session:
        usuario = await session.get(UsuarioModel, usuario_id)
        if not usuario:
            return UsuarioDeleteDTO(id=usuario_id, success=False, mensaje="Usuario no encontrado")
        
        await session.delete(usuario)
        await session.commit()
        return UsuarioDeleteDTO(id=usuario_id, success=True, mensaje="Usuario eliminado")

async def baja_logica_usuario(usuario_id: str) -> UsuarioReadDTO:
    async with AsyncSessionLocal() as session:
        usuario = await session.get(UsuarioModel, usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        usuario.baja_logica = True
        usuario.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(usuario)
        return UsuarioReadDTO.model_validate(usuario)
