from fastapi import APIRouter, HTTPException, status
from typing import List, Union
from dto.aplicacion_create_dto import AplicacionCreateDTO
from dto.aplicacion_update_dto import AplicacionUpdateDTO
from dto.aplicacion_put_dto import AplicacionPutDTO
from dto.aplicacion_read_dto import AplicacionReadDTO, AplicacionListDTO
from dto.aplicacion_delete_dto import AplicacionDeleteDTO
from services.aplicacion_service import (
    get_aplicacion_by_id,
    get_all_aplicaciones,
    create_aplicacion,
    update_aplicacion,
    delete_aplicacion,
    baja_logica_aplicacion,
    alta_logica_aplicacion
)

router = APIRouter(prefix="/aplicaciones", tags=["aplicaciones"])

@router.get("/", 
    response_model=AplicacionListDTO, 
    status_code=status.HTTP_200_OK,
    summary="Listar todas las aplicaciones",
    response_description="Listado de aplicaciones con contador total")
async def listar_aplicaciones(include_baja_logica: bool = True):
    """
    Obtiene el listado completo de aplicaciones registradas.
    Implementa el patrón RORO devolviendo un objeto con la lista y el total.
    """
    return await get_all_aplicaciones(include_baja_logica=include_baja_logica)

@router.get("/{aplicacion_id}", 
    response_model=AplicacionReadDTO, 
    status_code=status.HTTP_200_OK,
    summary="Obtener una aplicación por ID",
    response_description="Datos detallados de la aplicación solicitada")
async def obtener_aplicacion(aplicacion_id: str):
    """
    Busca una aplicación específica por su identificador alfanumérico.
    Retorna el DTO de lectura completo incluyendo datos de auditoría.
    """
    aplicacion = await get_aplicacion_by_id(aplicacion_id)
    if not aplicacion:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aplicación no encontrada")
    return aplicacion

@router.post("/", response_model=AplicacionReadDTO, status_code=status.HTTP_201_CREATED)
async def crear_aplicacion(aplicacion_data: AplicacionCreateDTO):
    if await get_aplicacion_by_id(aplicacion_data.id):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="El ID ya existe")
    return await create_aplicacion(aplicacion_data)

@router.put("/{aplicacion_id}", response_model=AplicacionReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_aplicacion_completa(aplicacion_id: str, aplicacion_data: AplicacionPutDTO):
    """Actualización completa (PUT) - Todos los campos son obligatorios"""
    if not await get_aplicacion_by_id(aplicacion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aplicación no encontrada")
    return await update_aplicacion(aplicacion_id, aplicacion_data)

@router.patch("/{aplicacion_id}", response_model=AplicacionReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_aplicacion_parcial(aplicacion_id: str, aplicacion_data: AplicacionUpdateDTO):
    """Actualización parcial (PATCH) - Campos opcionales"""
    if not await get_aplicacion_by_id(aplicacion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aplicación no encontrada")
    return await update_aplicacion(aplicacion_id, aplicacion_data)

@router.delete("/{aplicacion_id}", response_model=AplicacionDeleteDTO, status_code=status.HTTP_200_OK)
async def eliminar_aplicacion(aplicacion_id: str):
    result = await delete_aplicacion(aplicacion_id)
    if not result.success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=result.mensaje)
    return result

@router.patch("/{aplicacion_id}/baja-logica", response_model=AplicacionReadDTO)
async def dar_baja_logica(aplicacion_id: str):
    if not await get_aplicacion_by_id(aplicacion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aplicación no encontrada")
    return await baja_logica_aplicacion(aplicacion_id)

@router.patch("/{aplicacion_id}/alta-logica", response_model=AplicacionReadDTO)
async def dar_alta_logica(aplicacion_id: str):
    if not await get_aplicacion_by_id(aplicacion_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Aplicación no encontrada")
    return await alta_logica_aplicacion(aplicacion_id)
