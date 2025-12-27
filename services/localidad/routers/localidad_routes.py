from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional
from dto.localidad_create_dto import LocalidadCreateDTO
from dto.localidad_read_dto import LocalidadReadDTO, LocalidadListDTO
from dto.localidad_update_dto import LocalidadUpdateDTO
from dto.localidad_put_dto import LocalidadPutDTO
from dto.localidad_delete_dto import LocalidadDeleteDTO
from services import localidad_service

router = APIRouter(prefix="/localidades", tags=["Localidades"])

@router.get("/", response_model=LocalidadListDTO, summary="Listar localidades", response_description="Lista de localidades filtrada")
async def read_localidades(
    include_inactivos: bool = Query(True, description="Incluir registros con baja lógica"),
    id_pais: Optional[str] = Query(None, description="Filtrar por ID de País"),
    id_provincia: Optional[str] = Query(None, description="Filtrar por ID de Provincia")
):
    """
    Retorna todas las localidades, con filtros opcionales por país y provincia.
    """
    return await localidad_service.get_all_localidades(
        include_baja_logica=include_inactivos,
        id_pais=id_pais,
        id_provincia=id_provincia
    )

@router.get("/{localidad_id}", response_model=LocalidadReadDTO, summary="Obtener localidad por ID")
async def read_localidad(localidad_id: str = Path(..., description="ID de la localidad")):
    localidad = await localidad_service.get_localidad_by_id(localidad_id)
    if not localidad:
        raise HTTPException(status_code=404, detail="Localidad no encontrada")
    return localidad

@router.post("/", response_model=LocalidadReadDTO, status_code=201, summary="Crear localidad")
async def create_localidad(localidad: LocalidadCreateDTO):
    try:
        return await localidad_service.create_localidad(localidad)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{localidad_id}", response_model=LocalidadReadDTO, summary="Actualizar localidad (Reemplazo)")
async def update_localidad_put(localidad_id: str, localidad: LocalidadPutDTO):
    try:
        updated = await localidad_service.update_localidad(localidad_id, localidad)
        if not updated:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{localidad_id}", response_model=LocalidadReadDTO, summary="Actualizar localidad (Parcial)")
async def update_localidad_patch(localidad_id: str, localidad: LocalidadUpdateDTO):
    try:
        updated = await localidad_service.update_localidad(localidad_id, localidad)
        if not updated:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{localidad_id}", response_model=LocalidadDeleteDTO, summary="Eliminar localidad (Físico)")
async def delete_localidad(localidad_id: str):
    return await localidad_service.delete_localidad(localidad_id)

@router.post("/{localidad_id}/baja", response_model=LocalidadReadDTO, summary="Baja lógica de localidad")
async def baja_logica(localidad_id: str):
    updated = await localidad_service.baja_logica_localidad(localidad_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Localidad no encontrada")
    return updated

@router.post("/{localidad_id}/alta", response_model=LocalidadReadDTO, summary="Alta lógica de localidad")
async def alta_logica(localidad_id: str):
    updated = await localidad_service.alta_logica_localidad(localidad_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Localidad no encontrada")
    return updated
