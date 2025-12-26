from fastapi import APIRouter, HTTPException, status
from typing import List, Union
from dto.pais_create_dto import PaisCreateDTO
from dto.pais_update_dto import PaisUpdateDTO
from dto.pais_put_dto import PaisPutDTO
from dto.pais_read_dto import PaisReadDTO, PaisListDTO
from dto.pais_delete_dto import PaisDeleteDTO
from services.pais_service import (
    get_pais_by_id,
    get_all_paises,
    create_pais,
    update_pais,
    delete_pais,
    baja_logica_pais,
    alta_logica_pais
)

router = APIRouter(prefix="/paises", tags=["paises"])

@router.get("/", 
    response_model=PaisListDTO, 
    status_code=status.HTTP_200_OK,
    summary="Listar todos los países",
    response_description="Listado de países con contador total")
async def listar_paises(include_baja_logica: bool = True):
    """
    Obtiene el listado completo de países registrados.
    Implementa el patrón RORO devolviendo un objeto con la lista y el total.
    """
    return await get_all_paises(include_baja_logica=include_baja_logica)

@router.get("/{pais_id}", 
    response_model=PaisReadDTO, 
    status_code=status.HTTP_200_OK,
    summary="Obtener un país por ID",
    response_description="Datos detallados del país solicitado")
async def obtener_pais(pais_id: str):
    """
    Busca un país específico por su identificador alfanumérico.
    Retorna el DTO de lectura completo incluyendo datos de auditoría.
    """
    pais = await get_pais_by_id(pais_id)
    if not pais:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="País no encontrado")
    return pais

@router.post("/", response_model=PaisReadDTO, status_code=status.HTTP_201_CREATED)
async def crear_pais(pais_data: PaisCreateDTO):
    if await get_pais_by_id(pais_data.id):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="El ID ya existe")
    return await create_pais(pais_data)

@router.put("/{pais_id}", response_model=PaisReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_pais_completo(pais_id: str, pais_data: PaisPutDTO):
    """Actualización completa (PUT) - Todos los campos son obligatorios"""
    if not await get_pais_by_id(pais_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="País no encontrado")
    return await update_pais(pais_id, pais_data)

@router.patch("/{pais_id}", response_model=PaisReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_pais_parcial(pais_id: str, pais_data: PaisUpdateDTO):
    """Actualización parcial (PATCH) - Campos opcionales"""
    if not await get_pais_by_id(pais_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="País no encontrado")
    return await update_pais(pais_id, pais_data)

@router.delete("/{pais_id}", response_model=PaisDeleteDTO, status_code=status.HTTP_200_OK)
async def eliminar_pais(pais_id: str):
    result = await delete_pais(pais_id)
    if not result.success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=result.mensaje)
    return result

@router.patch("/{pais_id}/baja-logica", response_model=PaisReadDTO)
async def dar_baja_logica(pais_id: str):
    if not await get_pais_by_id(pais_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="País no encontrado")
    return await baja_logica_pais(pais_id)

@router.patch("/{pais_id}/alta-logica", response_model=PaisReadDTO)
async def dar_alta_logica(pais_id: str):
    if not await get_pais_by_id(pais_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="País no encontrado")
    return await alta_logica_pais(pais_id)
