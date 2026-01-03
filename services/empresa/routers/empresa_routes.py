from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from dto.empresa_create_dto import EmpresaCreateDTO
from dto.empresa_update_dto import EmpresaUpdateDTO
from dto.empresa_put_dto import EmpresaPutDTO
from dto.empresa_read_dto import EmpresaReadDTO, EmpresaListDTO
from dto.empresa_delete_dto import EmpresaDeleteDTO
from services.empresa_service import (
    get_all_empresas, get_empresa_by_id, create_empresa, 
    update_empresa, delete_empresa, baja_logica_empresa, 
    alta_logica_empresa, validate_corporacion
)

router = APIRouter(prefix="/empresas", tags=["empresas"])

@router.get("/", response_model=EmpresaListDTO)
async def list_empresas(include_baja_logica: bool = True, db: AsyncSession = Depends(get_db)):
    return await get_all_empresas(db, include_baja_logica)

@router.get("/{id}", response_model=EmpresaReadDTO)
async def get_empresa(id: str, db: AsyncSession = Depends(get_db)):
    empresa = await get_empresa_by_id(db, id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa

@router.post("/", response_model=EmpresaReadDTO, status_code=status.HTTP_201_CREATED)
async def create_new_empresa(data: EmpresaCreateDTO, db: AsyncSession = Depends(get_db)):
    # Validar integridad referencial con Corporación
    if not await validate_corporacion(data.id_corporacion):
        raise HTTPException(status_code=400, detail=f"La corporación '{data.id_corporacion}' no existe o no está disponible")
    
    # Validar ID único
    if await get_empresa_by_id(db, data.id):
        raise HTTPException(status_code=409, detail="El ID de la empresa ya existe")
        
    return await create_empresa(db, data)

@router.put("/{id}", response_model=EmpresaReadDTO)
async def put_empresa(id: str, data: EmpresaPutDTO, db: AsyncSession = Depends(get_db)):
    if not await validate_corporacion(data.id_corporacion):
        raise HTTPException(status_code=400, detail=f"La corporación '{data.id_corporacion}' no existe")
    
    empresa = await update_empresa(db, id, EmpresaUpdateDTO(**data.model_dump()))
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa

@router.patch("/{id}", response_model=EmpresaReadDTO)
async def patch_empresa(id: str, data: EmpresaUpdateDTO, db: AsyncSession = Depends(get_db)):
    if data.id_corporacion and not await validate_corporacion(data.id_corporacion):
        raise HTTPException(status_code=400, detail=f"La corporación '{data.id_corporacion}' no existe")
        
    empresa = await update_empresa(db, id, data)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa

@router.delete("/{id}", response_model=EmpresaDeleteDTO)
async def remove_empresa(id: str, db: AsyncSession = Depends(get_db)):
    return await delete_empresa(db, id)

@router.patch("/{id}/baja-logica", response_model=EmpresaReadDTO)
async def set_baja_logica(id: str, db: AsyncSession = Depends(get_db)):
    empresa = await baja_logica_empresa(db, id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa

@router.patch("/{id}/alta-logica", response_model=EmpresaReadDTO)
async def set_alta_logica(id: str, db: AsyncSession = Depends(get_db)):
    empresa = await alta_logica_empresa(db, id)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa
