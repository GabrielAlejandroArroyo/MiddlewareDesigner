from fastapi import APIRouter, HTTPException, status
from typing import List, Union
from dto.corporacion_create_dto import CorporacionCreateDTO
from dto.corporacion_update_dto import CorporacionUpdateDTO
from dto.corporacion_put_dto import CorporacionPutDTO
from dto.corporacion_read_dto import CorporacionReadDTO, CorporacionListDTO
from dto.corporacion_delete_dto import CorporacionDeleteDTO
from services.corporacion_service import (
    get_corporacion_by_id,
    get_all_corporaciones,
    create_corporacion,
    update_corporacion,
    delete_corporacion,
    baja_logica_corporacion,
    alta_logica_corporacion
)

router = APIRouter(prefix="/corporaciones", tags=["corporaciones"])

@router.get("/", 
    response_model=CorporacionListDTO, 
    status_code=status.HTTP_200_OK,
    summary="Listar todas las corporaciones",
    response_description="Listado de corporaciones con contador total")
async def listar_corporaciones(include_baja_logica: bool = True):
    """
    Obtiene el listado completo de corporaciones registradas.
    Implementa el patrón RORO devolviendo un objeto con la lista y el total.
    """
    return await get_all_corporaciones(include_baja_logica=include_baja_logica)

@router.get("/{corporacion_id}", 
    response_model=CorporacionReadDTO, 
    status_code=status.HTTP_200_OK,
    summary="Obtener una corporación por ID",
    response_description="Datos detallados de la corporación solicitada")
async def obtener_corporacion(corporacion_id: str):
    """
    Busca una corporación específica por su identificador alfanumérico.
    Retorna el DTO de lectura completo incluyendo datos de auditoría.
    """
    corporacion = await get_corporacion_by_id(corporacion_id)
    if not corporacion:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Corporación no encontrada")
    return corporacion

@router.post("/", response_model=CorporacionReadDTO, status_code=status.HTTP_201_CREATED)
async def crear_corporacion(corporacion_data: CorporacionCreateDTO):
    if await get_corporacion_by_id(corporacion_data.id):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="El ID ya existe")
    return await create_corporacion(corporacion_data)

@router.put("/{corporacion_id}", response_model=CorporacionReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_corporacion_completa(corporacion_id: str, corporacion_data: CorporacionPutDTO):
    """Actualización completa (PUT) - Todos los campos son obligatorios"""
    if not await get_corporacion_by_id(corporacion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Corporación no encontrada")
    return await update_corporacion(corporacion_id, corporacion_data)

@router.patch("/{corporacion_id}", response_model=CorporacionReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_corporacion_parcial(corporacion_id: str, corporacion_data: CorporacionUpdateDTO):
    """Actualización parcial (PATCH) - Campos opcionales"""
    if not await get_corporacion_by_id(corporacion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Corporación no encontrada")
    return await update_corporacion(corporacion_id, corporacion_data)

@router.delete("/{corporacion_id}", response_model=CorporacionDeleteDTO, status_code=status.HTTP_200_OK)
async def eliminar_corporacion(corporacion_id: str):
    result = await delete_corporacion(corporacion_id)
    if not result.success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=result.mensaje)
    return result

@router.patch("/{corporacion_id}/baja-logica", response_model=CorporacionReadDTO)
async def dar_baja_logica(corporacion_id: str):
    if not await get_corporacion_by_id(corporacion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Corporación no encontrada")
    return await baja_logica_corporacion(corporacion_id)

@router.patch("/{corporacion_id}/alta-logica", response_model=CorporacionReadDTO)
async def dar_alta_logica(corporacion_id: str):
    if not await get_corporacion_by_id(corporacion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Corporación no encontrada")
    return await alta_logica_corporacion(corporacion_id)
