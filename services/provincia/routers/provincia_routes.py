from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from dto.provincia_create_dto import ProvinciaCreateDTO
from dto.provincia_update_dto import ProvinciaUpdateDTO
from dto.provincia_put_dto import ProvinciaPutDTO
from dto.provincia_read_dto import ProvinciaReadDTO, ProvinciaListDTO
from dto.provincia_delete_dto import ProvinciaDeleteDTO
from services.provincia_service import (
    get_provincia_by_id,
    get_all_provincias,
    create_provincia,
    update_provincia,
    delete_provincia,
    baja_logica_provincia,
    alta_logica_provincia,
    validar_pais_existe
)

router = APIRouter(prefix="/provincias", tags=["provincias"])

@router.get("/", 
    response_model=ProvinciaListDTO, 
    status_code=status.HTTP_200_OK,
    summary="Listar todas las provincias",
    response_description="Listado de provincias con contador total")
async def listar_provincias(include_baja_logica: bool = True, id_pais: Optional[str] = None):
    """
    Obtiene el listado completo de provincias registradas.
    Permite filtrar por estado de baja lógica y por ID de país.
    """
    return await get_all_provincias(include_baja_logica=include_baja_logica, id_pais=id_pais)

@router.get("/{provincia_id}", 
    response_model=ProvinciaReadDTO, 
    status_code=status.HTTP_200_OK,
    summary="Obtener una provincia por ID",
    response_description="Datos detallados de la provincia solicitada")
async def obtener_provincia(provincia_id: str):
    """
    Busca una provincia específica por su identificador.
    """
    provincia = await get_provincia_by_id(provincia_id)
    if not provincia:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Provincia no encontrada")
    return provincia

@router.post("/", response_model=ProvinciaReadDTO, status_code=status.HTTP_201_CREATED)
async def crear_provincia(provincia_data: ProvinciaCreateDTO):
    # Validar existencia del país
    if not await validar_pais_existe(provincia_data.id_pais):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"El ID de país '{provincia_data.id_pais}' no existe en el microservicio de Pais"
        )
    
    if await get_provincia_by_id(provincia_data.id):
        raise HTTPException(status.HTTP_409_CONFLICT, detail="El ID ya existe")
    
    return await create_provincia(provincia_data)

@router.put("/{provincia_id}", response_model=ProvinciaReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_provincia_completa(provincia_id: str, provincia_data: ProvinciaPutDTO):
    if not await get_provincia_by_id(provincia_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Provincia no encontrada")
    
    if not await validar_pais_existe(provincia_data.id_pais):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="El ID de país no existe")
        
    return await update_provincia(provincia_id, provincia_data)

@router.patch("/{provincia_id}", response_model=ProvinciaReadDTO, status_code=status.HTTP_200_OK)
async def actualizar_provincia_parcial(provincia_id: str, provincia_data: ProvinciaUpdateDTO):
    if not await get_provincia_by_id(provincia_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Provincia no encontrada")
    
    if provincia_data.id_pais and not await validar_pais_existe(provincia_data.id_pais):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="El ID de país no existe")

    return await update_provincia(provincia_id, provincia_data)

@router.delete("/{provincia_id}", response_model=ProvinciaDeleteDTO, status_code=status.HTTP_200_OK)
async def eliminar_provincia(provincia_id: str):
    result = await delete_provincia(provincia_id)
    if not result.success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=result.mensaje)
    return result

@router.patch("/{provincia_id}/baja-logica", response_model=ProvinciaReadDTO)
async def dar_baja_logica(provincia_id: str):
    if not await get_provincia_by_id(provincia_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Provincia no encontrada")
    return await baja_logica_provincia(provincia_id)

@router.patch("/{provincia_id}/alta-logica", response_model=ProvinciaReadDTO)
async def dar_alta_logica(provincia_id: str):
    if not await get_provincia_by_id(provincia_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Provincia no encontrada")
    return await alta_logica_provincia(provincia_id)

