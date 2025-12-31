from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from config.database import get_db
from dto.corporacion_base_dto import (
    CorporacionCreateDTO, CorporacionReadDTO, CorporacionUpdateDTO
)
from dto.corporacion_delete_dto import CorporacionDeleteDTO
from services import corporacion_service

router = APIRouter(
    prefix="/corporaciones", 
    tags=["Corporaciones"],
    responses={404: {"description": "Corporación no encontrada"}}
)

@router.get(
    "/", 
    response_model=List[CorporacionReadDTO],
    summary="Listar todas las corporaciones activas",
    description="Obtiene una lista de todas las corporaciones que no están dadas de baja lógicamente"
)
async def read_corporaciones(db: AsyncSession = Depends(get_db)):
    """Obtener todas las corporaciones activas"""
    return await corporacion_service.get_all_corporaciones(db)

@router.get(
    "/{corporacion_id}", 
    response_model=CorporacionReadDTO,
    summary="Obtener corporación por ID",
    description="Obtiene el detalle completo de una corporación específica por su ID"
)
async def read_corporacion(
    corporacion_id: int = Path(..., description="ID único de la corporación", example=1, gt=0),
    db: AsyncSession = Depends(get_db)
):
    """Obtener el detalle de una corporación activa por ID"""
    corp = await corporacion_service.get_corporacion_by_id(db, corporacion_id)
    if not corp:
        raise HTTPException(status_code=404, detail="Corporación no encontrada o inactiva")
    return corp

@router.post(
    "/", 
    response_model=CorporacionReadDTO, 
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva corporación",
    description="Crea una nueva corporación con los datos proporcionados"
)
async def create_corporacion(
    corporacion_data: CorporacionCreateDTO, 
    db: AsyncSession = Depends(get_db)
):
    """Alta de Corporación"""
    return await corporacion_service.create_corporacion(db, corporacion_data)

@router.put(
    "/{corporacion_id}", 
    response_model=CorporacionReadDTO,
    summary="Actualizar corporación",
    description="Actualiza los datos de una corporación existente. Solo se actualizan los campos proporcionados."
)
async def update_corporacion(
    corporacion_id: int = Path(..., description="ID único de la corporación a actualizar", example=1, gt=0),
    corporacion_data: CorporacionUpdateDTO = ..., 
    db: AsyncSession = Depends(get_db)
):
    """Actualizar datos de una corporación"""
    corp = await corporacion_service.update_corporacion(db, corporacion_id, corporacion_data)
    if not corp:
        raise HTTPException(status_code=404, detail="Corporación no encontrada")
    return corp

@router.delete(
    "/{corporacion_id}", 
    response_model=CorporacionDeleteDTO,
    summary="Eliminar corporación",
    description="Elimina una corporación. Por defecto realiza una baja lógica. Si hard_delete es true, elimina definitivamente del sistema."
)
async def delete_corporacion(
    corporacion_id: int = Path(..., description="ID único de la corporación a eliminar", example=1, gt=0),
    hard_delete: bool = Query(False, description="Si es true, elimina definitivamente del sistema. Por defecto realiza baja lógica."),
    db: AsyncSession = Depends(get_db)
):
    """Eliminar corporación (Baja lógica por defecto)"""
    success = await corporacion_service.delete_corporacion(db, corporacion_id, hard_delete)
    if not success:
        raise HTTPException(status_code=404, detail="Corporación no encontrada")
    
    msg = "Corporación eliminada definitivamente" if hard_delete else "Corporación dada de baja lógicamente"
    return {"id": corporacion_id, "success": True, "message": msg}
