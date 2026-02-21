from passlib.context import CryptContext
from shared.id_generator import generate_entity_id

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union, Tuple
from datetime import datetime

from config.database import AsyncSessionLocal
from entity.usuario_model import UsuarioModel
from dto.usuario_create_dto import UsuarioCreateDTO
from dto.usuario_read_dto import UsuarioReadDTO, UsuarioListDTO
from dto.usuario_update_dto import UsuarioUpdateDTO, UsuarioPutDTO
from dto.usuario_delete_dto import UsuarioDeleteDTO

_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _hash_password(password: str) -> str:
    return _ctx.hash(password)

def _verify_password(plain: str, hashed: str) -> bool:
    return _ctx.verify(plain, hashed)

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

async def get_usuario_by_nombre_usuario(nombre_usuario: str) -> Optional[UsuarioReadDTO]:
    """Busca usuario por nombre_usuario (para login y validación de duplicados)."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UsuarioModel).where(UsuarioModel.nombre_usuario == nombre_usuario)
        )
        usuario = result.scalar_one_or_none()
        if usuario:
            return UsuarioReadDTO.model_validate(usuario)
        return None

async def get_usuario_by_id(usuario_id: str) -> Optional[UsuarioReadDTO]:
    async with AsyncSessionLocal() as session:
        usuario = await session.get(UsuarioModel, usuario_id)
        if usuario:
            return UsuarioReadDTO.model_validate(usuario)
        return None

async def create_usuario(usuario_data: UsuarioCreateDTO) -> UsuarioReadDTO:
    async with AsyncSessionLocal() as session:
        now = datetime.utcnow()
        user_id = usuario_data.id or generate_entity_id("USUA")
        password_hash = _hash_password(usuario_data.password)
        requiere_cambio = usuario_data.requiere_cambio_password
        new_usuario = UsuarioModel(
            id=user_id,
            email=usuario_data.email,
            nombre_usuario=usuario_data.nombre_usuario,
            nombre=usuario_data.nombre,
            apellido=usuario_data.apellido,
            password_hash=password_hash,
            requiere_cambio_password=requiere_cambio,
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
        if "password" in update_data:
            usuario.password_hash = _hash_password(update_data.pop("password"))
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
        if usuario.nombre_usuario == "admin":
            return UsuarioDeleteDTO(id=usuario_id, success=False, mensaje="No se puede eliminar el usuario admin (entidad protegida)")

        await session.delete(usuario)
        await session.commit()
        return UsuarioDeleteDTO(id=usuario_id, success=True, mensaje="Usuario eliminado")

async def validate_credentials(username: str, password: str) -> Optional[Tuple[str, str, bool]]:
    """
    Valida usuario y contraseña. Retorna (usuario_id, nombre_usuario, requires_password_change) o None.
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UsuarioModel).where(
                UsuarioModel.nombre_usuario == username,
                UsuarioModel.baja_logica == False,
            )
        )
        model = result.scalar_one_or_none()
        if not model or not getattr(model, "password_hash", None):
            return None
        try:
            if not _verify_password(password, model.password_hash):
                return None
        except (ValueError, TypeError):
            return None
        return (model.id, model.nombre_usuario, model.requiere_cambio_password)


async def cambiar_password(usuario_id: str, password_actual: str, password_nueva: str) -> UsuarioReadDTO:
    """Cambia la contraseña del usuario. Verifica password_actual antes de actualizar."""
    async with AsyncSessionLocal() as session:
        usuario = await session.get(UsuarioModel, usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if not _verify_password(password_actual, usuario.password_hash):
            raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
        usuario.password_hash = _hash_password(password_nueva)
        usuario.requiere_cambio_password = False
        usuario.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(usuario)
        return UsuarioReadDTO.model_validate(usuario)


async def baja_logica_usuario(usuario_id: str) -> UsuarioReadDTO:
    async with AsyncSessionLocal() as session:
        usuario = await session.get(UsuarioModel, usuario_id)
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if usuario.nombre_usuario == "admin":
            raise HTTPException(status_code=400, detail="No se puede dar de baja el usuario admin (entidad protegida)")

        usuario.baja_logica = True
        usuario.fecha_alta_modificacion = datetime.utcnow()
        await session.commit()
        await session.refresh(usuario)
        return UsuarioReadDTO.model_validate(usuario)
