from fastapi import APIRouter, HTTPException, status
from typing import List
from dto.usuario_create_dto import UsuarioCreateDTO
from dto.usuario_read_dto import UsuarioReadDTO, UsuarioListDTO
from dto.usuario_update_dto import UsuarioUpdateDTO, UsuarioPutDTO
from dto.usuario_delete_dto import UsuarioDeleteDTO
from services.usuario_service import (
    get_usuario_by_id,
    get_all_usuarios,
    create_usuario,
    update_usuario,
    delete_usuario,
    baja_logica_usuario
)

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

@router.get("/", response_model=UsuarioListDTO)
async def listar_usuarios(include_baja_logica: bool = True):
    return await get_all_usuarios(include_baja_logica=include_baja_logica)

@router.get("/{usuario_id}", response_model=UsuarioReadDTO)
async def obtener_usuario(usuario_id: str):
    usuario = await get_usuario_by_id(usuario_id)
    if not usuario:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return usuario

@router.post("/", response_model=UsuarioReadDTO, status_code=status.HTTP_201_CREATED)
async def crear_usuario(usuario_data: UsuarioCreateDTO):
    if await get_usuario_by_id(usuario_data.id):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="El ID de usuario ya existe")
    return await create_usuario(usuario_data)

@router.put("/{usuario_id}", response_model=UsuarioReadDTO)
async def actualizar_usuario_completo(usuario_id: str, usuario_data: UsuarioPutDTO):
    return await update_usuario(usuario_id, usuario_data)

@router.patch("/{usuario_id}", response_model=UsuarioReadDTO)
async def actualizar_usuario_parcial(usuario_id: str, usuario_data: UsuarioUpdateDTO):
    return await update_usuario(usuario_id, usuario_data)

@router.delete("/{usuario_id}", response_model=UsuarioDeleteDTO)
async def eliminar_usuario(usuario_id: str):
    return await delete_usuario(usuario_id)

@router.patch("/{usuario_id}/baja-logica", response_model=UsuarioReadDTO)
async def dar_baja_logica(usuario_id: str):
    return await baja_logica_usuario(usuario_id)
