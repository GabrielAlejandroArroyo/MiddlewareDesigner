from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from dto.corporacion_base_dto import (
    CorporacionCreateDTO, CorporacionReadDTO, CorporacionUpdateDTO, CorporacionListDTO
)
from dto.corporacion_delete_dto import CorporacionDeleteDTO
from services import corporacion_service

router = APIRouter(
    prefix="/corporaciones", 
    tags=["corporaciones"],
    responses={404: {"description": "Corporación no encontrada"}}
)

@router.get(
    "/", 
    response_model=CorporacionListDTO,
    status_code=status.HTTP_200_OK,
    summary="Listar todas las corporaciones",
    response_description="Listado de corporaciones con contador total"
)
async def listar_corporaciones(include_baja_logica: bool = True, db: AsyncSession = Depends(get_db)):
    """
    Obtiene el listado completo de corporaciones registradas.
    Implementa el patrón RORO devolviendo un objeto con la lista y el total.
    """
    return await corporacion_service.get_all_corporaciones(db, include_baja_logica=include_baja_logica)

@router.get(
    "/{corporacion_id}", 
    response_model=CorporacionReadDTO,
    status_code=status.HTTP_200_OK,
    summary="Obtener una corporación por ID",
    response_description="Datos detallados de la corporación solicitada"
)
async def obtener_corporacion(corporacion_id: int, db: AsyncSession = Depends(get_db)):
    """
    Busca una corporación específica por su identificador.
    Retorna el DTO de lectura completo incluyendo datos de auditoría.
    """
    corp = await corporacion_service.get_corporacion_by_id(db, corporacion_id)
    if not corp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Corporación no encontrada")
    return corp

@router.post(
    "/", 
    response_model=CorporacionReadDTO, 
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva corporación",
    description="Crea una nueva corporación con los datos proporcionados"
)
async def crear_corporacion(corporacion_data: CorporacionCreateDTO, db: AsyncSession = Depends(get_db)):
    """Alta de Corporación"""
    return await corporacion_service.create_corporacion(db, corporacion_data)

@router.put(
    "/{corporacion_id}", 
    response_model=CorporacionReadDTO,
    status_code=status.HTTP_200_OK,
    summary="Actualizar corporación completa",
    description="Actualización completa (PUT) - Todos los campos son obligatorios"
)
async def actualizar_corporacion_completa(corporacion_id: int, corporacion_data: CorporacionUpdateDTO, db: AsyncSession = Depends(get_db)):
    """Actualizar datos de una corporación"""
    corp = await corporacion_service.update_corporacion(db, corporacion_id, corporacion_data)
    if not corp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Corporación no encontrada")
    return corp

@router.delete(
    "/{corporacion_id}", 
    response_model=CorporacionDeleteDTO,
    status_code=status.HTTP_200_OK,
    summary="Eliminar corporación",
    description="Elimina una corporación. Por defecto realiza una baja lógica. Si hard_delete es true, elimina definitivamente del sistema."
)
async def eliminar_corporacion(corporacion_id: int, hard_delete: bool = False, db: AsyncSession = Depends(get_db)):
    """Eliminar corporación (Baja lógica por defecto)"""
    success = await corporacion_service.delete_corporacion(db, corporacion_id, hard_delete)
    if not success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Corporación no encontrada")
    
    msg = "Corporación eliminada definitivamente" if hard_delete else "Corporación dada de baja lógicamente"
    return {"id": corporacion_id, "success": True, "message": msg}
