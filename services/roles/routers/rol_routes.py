from fastapi import APIRouter, HTTPException, status
from typing import List, Union
from dto.rol_create_dto import RolCreateDTO
from dto.rol_update_dto import RolUpdateDTO
from dto.rol_put_dto import RolPutDTO
from dto.rol_read_dto import RolReadDTO, RolListDTO
from dto.rol_delete_dto import RolDeleteDTO
from services.rol_service import (
    get_rol_by_id,
    get_all_roles,
    create_rol,
    update_rol,
    delete_rol,
    baja_logica_rol,
    alta_logica_rol
)

router = APIRouter(prefix="/roles", tags=["roles"])

@router.get("/", 
    response_model=RolListDTO, 
    status_code=status.HTTP_200_OK,
    summary="Listar todos los roles",
    response_description="Listado de roles con contador total")
async def listar_roles(include_baja_logica: bool = True):
    """
    Obtiene el listado completo de roles registrados.
    Implementa el patrón RORO devolviendo un objeto con la lista y el total.
    """
    return await get_all_roles(include_baja_logica=include_baja_logica)

@router.get("/{rol_id}", 
    response_model=RolReadDTO, 
    status_code=status.HTTP_200_OK,
    summary="Obtener un rol por ID",
    response_description="Datos detallados del rol solicitado")
async def obtener_rol(rol_id: str):
    """
    Busca un rol específico por su identificador alfanumérico.
    Retorna el DTO de lectura completo incluyendo datos de auditoría.
    """
    rol = await get_rol_by_id(rol_id)
    if not rol:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Rol no encontrado")
    return rol

@router.post("/", response_model=RolReadDTO, status_code=status.HTTP_201_CREATED)
async def crear_rol(rol_data: RolCreateDTO):
    if await get_rol_by_id(rol_data.id):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="El ID de rol ya existe")
    return await create_rol(rol_data)

@router.put("/{rol_id}", response_model=RolReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_rol_completo(rol_id: str, rol_data: RolPutDTO):
    """Actualización completa (PUT) - Todos los campos son obligatorios"""
    return await update_rol(rol_id, rol_data)

@router.patch("/{rol_id}", response_model=RolReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_rol_parcial(rol_id: str, rol_data: RolUpdateDTO):
    """Actualización parcial (PATCH) - Campos opcionales"""
    return await update_rol(rol_id, rol_data)

@router.delete("/{rol_id}", response_model=RolDeleteDTO, status_code=status.HTTP_200_OK)
async def eliminar_rol(rol_id: str):
    result = await delete_rol(rol_id)
    if not result.success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=result.mensaje)
    return result

@router.patch("/{rol_id}/baja-logica", response_model=RolReadDTO)
async def dar_baja_logica(rol_id: str):
    return await baja_logica_rol(rol_id)

@router.patch("/{rol_id}/alta-logica", response_model=RolReadDTO)
async def dar_alta_logica(rol_id: str):
    return await alta_logica_rol(rol_id)
