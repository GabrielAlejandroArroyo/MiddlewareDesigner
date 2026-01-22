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

@router.get("/{id}", response_model=AplicacionRoleReadDTO)
async def get_one(id: str):
    item = await service.get_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    return item

@router.post("/", response_model=AplicacionRoleReadDTO, status_code=status.HTTP_201_CREATED)
async def create(data: AplicacionRoleCreateDTO):
    return await service.create(data)

@router.put("/{id}", response_model=AplicacionRoleReadDTO)
async def update_full(id: str, data: AplicacionRolePutDTO):
    return await service.update(id, data)

@router.patch("/{id}", response_model=AplicacionRoleReadDTO)
async def update_partial(id: str, data: AplicacionRoleUpdateDTO):
    return await service.update(id, data)

@router.delete("/{id}", response_model=AplicacionRoleDeleteDTO)
async def delete(id: str):
    return await service.delete(id)

@router.patch("/{id}/baja-logica", response_model=AplicacionRoleReadDTO)
async def set_baja(id: str):
    return await service.toggle_baja(id, True)

@router.patch("/{id}/alta-logica", response_model=AplicacionRoleReadDTO)
async def set_alta(id: str):
    return await service.toggle_baja(id, False)
