from fastapi import APIRouter, HTTPException, status
from typing import List, Union
from dto.aplicacion_role_create_dto import AplicacionRoleCreateDTO
from dto.aplicacion_role_update_dto import AplicacionRoleUpdateDTO, AplicacionRolePutDTO
from dto.aplicacion_role_read_dto import AplicacionRoleReadDTO, AplicacionRoleListDTO
from dto.aplicacion_role_delete_dto import AplicacionRoleDeleteDTO
import services.aplicacion_role_service as service

router = APIRouter(prefix="/aplicacion-roles", tags=["Aplicacion-Role"])

@router.get("/", response_model=AplicacionRoleListDTO)
async def list_all(include_baja: bool = True):
    return await service.get_all(include_baja)

@router.get("/{internal_id}", response_model=AplicacionRoleReadDTO)
async def get_one(internal_id: int):
    item = await service.get_by_internal_id(internal_id)
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item

@router.post("/", response_model=AplicacionRoleReadDTO, status_code=status.HTTP_201_CREATED)
async def create(data: AplicacionRoleCreateDTO):
    return await service.create(data)

@router.put("/{internal_id}", response_model=AplicacionRoleReadDTO)
async def update_full(internal_id: int, data: AplicacionRolePutDTO):
    return await service.update(internal_id, data)

@router.patch("/{internal_id}", response_model=AplicacionRoleReadDTO)
async def update_partial(internal_id: int, data: AplicacionRoleUpdateDTO):
    return await service.update(internal_id, data)

@router.delete("/{internal_id}", response_model=AplicacionRoleDeleteDTO)
async def delete(internal_id: int):
    return await service.delete(internal_id)

@router.patch("/{internal_id}/baja-logica", response_model=AplicacionRoleReadDTO)
async def set_baja(internal_id: int):
    return await service.toggle_baja(internal_id, True)

@router.patch("/{internal_id}/alta-logica", response_model=AplicacionRoleReadDTO)
async def set_alta(internal_id: int):
    return await service.toggle_baja(internal_id, False)
