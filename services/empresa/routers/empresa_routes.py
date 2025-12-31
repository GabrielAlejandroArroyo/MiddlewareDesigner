from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from config.database import get_db
from dto.empresa_base_dto import EmpresaCreateDTO, EmpresaReadDTO, EmpresaUpdateDTO, EmpresaDeleteDTO
from services import empresa_service

router = APIRouter(
    prefix="/empresas", 
    tags=["Empresas"],
    responses={404: {"description": "Empresa no encontrada"}}
)

@router.get(
    "/", 
    response_model=List[EmpresaReadDTO],
    summary="Listar todas las empresas activas",
    description="Obtiene una lista de todas las empresas que no están dadas de baja lógicamente, incluyendo sus asociaciones con corporaciones"
)
async def read_empresas(db: AsyncSession = Depends(get_db)):
    """Listar todas las empresas activas"""
    return await empresa_service.get_all_empresas(db)

@router.get(
    "/{empresa_id}", 
    response_model=EmpresaReadDTO,
    summary="Obtener empresa por ID",
    description="Obtiene el detalle completo de una empresa específica por su ID, incluyendo las corporaciones asociadas"
)
async def read_empresa(
    empresa_id: int = Path(..., description="ID único de la empresa", example=1, gt=0),
    db: AsyncSession = Depends(get_db)
):
    """Obtener detalle de una empresa activa"""
    emp = await empresa_service.get_empresa_by_id(db, empresa_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return emp

@router.post(
    "/", 
    response_model=EmpresaReadDTO, 
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva empresa",
    description="Crea una nueva empresa con los datos proporcionados y la asocia con las corporaciones especificadas"
)
async def create_empresa(
    empresa_data: EmpresaCreateDTO, 
    db: AsyncSession = Depends(get_db)
):
    """Alta de Empresa y asociación con corporaciones"""
    return await empresa_service.create_empresa(db, empresa_data)

@router.put(
    "/{empresa_id}", 
    response_model=EmpresaReadDTO,
    summary="Actualizar empresa",
    description="Actualiza los datos de una empresa existente y sus asociaciones con corporaciones. Solo se actualizan los campos proporcionados."
)
async def update_empresa(
    empresa_id: int = Path(..., description="ID único de la empresa a actualizar", example=1, gt=0),
    empresa_data: EmpresaUpdateDTO = ...,
    db: AsyncSession = Depends(get_db)
):
    """Actualizar datos de empresa y sus asociaciones"""
    emp = await empresa_service.update_empresa(db, empresa_id, empresa_data)
    if not emp:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return emp

@router.delete(
    "/{empresa_id}", 
    response_model=EmpresaDeleteDTO,
    summary="Eliminar empresa",
    description="Elimina una empresa. Por defecto realiza una baja lógica. Si hard_delete es true, elimina definitivamente del sistema junto con sus asociaciones."
)
async def delete_empresa(
    empresa_id: int = Path(..., description="ID único de la empresa a eliminar", example=1, gt=0),
    hard_delete: bool = Query(False, description="Si es true, elimina definitivamente del sistema. Por defecto realiza baja lógica."),
    db: AsyncSession = Depends(get_db)
):
    """Baja de empresa (lógica por defecto)"""
    success = await empresa_service.delete_empresa(db, empresa_id, hard_delete)
    if not success:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    msg = "Empresa eliminada definitivamente" if hard_delete else "Empresa dada de baja lógicamente"
    return {"id": empresa_id, "success": True, "message": msg}
