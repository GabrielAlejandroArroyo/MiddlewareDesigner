from fastapi import APIRouter, HTTPException, status
from typing import Union
from dto.usuario_rol_create_dto import UsuarioRolCreateDTO
from dto.usuario_rol_update_dto import UsuarioRolUpdateDTO, UsuarioRolPutDTO
from dto.usuario_rol_read_dto import UsuarioRolReadDTO, UsuarioRolListDTO
from dto.usuario_rol_delete_dto import UsuarioRolDeleteDTO
import services.usuario_rol_service as service

router = APIRouter(prefix="/usuario-roles", tags=["Usuario-Rol"])

@router.get("/", response_model=UsuarioRolListDTO)
async def list_all(include_baja: bool = True):
    return await service.get_all(include_baja)

@router.get("/{internal_id}", response_model=UsuarioRolReadDTO)
async def get_one(internal_id: int):
    item = await service.get_by_internal_id(internal_id)
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item

@router.post("/", response_model=UsuarioRolReadDTO, status_code=status.HTTP_201_CREATED)
async def create(data: UsuarioRolCreateDTO):
    return await service.create(data)

@router.put("/{internal_id}", response_model=UsuarioRolReadDTO)
async def update_full(internal_id: int, data: UsuarioRolPutDTO):
    return await service.update(internal_id, data)

@router.patch("/{internal_id}", response_model=UsuarioRolReadDTO)
async def update_partial(internal_id: int, data: UsuarioRolUpdateDTO):
    return await service.update(internal_id, data)

@router.delete("/{internal_id}", response_model=UsuarioRolDeleteDTO)
async def delete(internal_id: int):
    return await service.delete(internal_id)

@router.patch("/{internal_id}/baja-logica", response_model=UsuarioRolReadDTO)
async def set_baja(internal_id: int):
    return await service.toggle_baja(internal_id, True)

@router.patch("/{internal_id}/alta-logica", response_model=UsuarioRolReadDTO)
async def set_alta(internal_id: int):
    return await service.toggle_baja(internal_id, False)
