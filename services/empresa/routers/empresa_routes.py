from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import get_db
from dto.empresa_base_dto import EmpresaCreateDTO, EmpresaReadDTO, EmpresaUpdateDTO, EmpresaDeleteDTO, EmpresaListDTO
from services import empresa_service

router = APIRouter(
    prefix="/empresas", 
    tags=["empresas"],
    responses={404: {"description": "Empresa no encontrada"}}
)

@router.get(
    "/", 
    response_model=EmpresaListDTO,
    status_code=status.HTTP_200_OK,
    summary="Listar todas las empresas",
    response_description="Listado de empresas con contador total"
)
async def listar_empresas(include_baja_logica: bool = True, db: AsyncSession = Depends(get_db)):
    """
    Obtiene el listado completo de empresas registradas.
    Implementa el patrón RORO devolviendo un objeto con la lista y el total.
    """
    return await empresa_service.get_all_empresas(db, include_baja_logica=include_baja_logica)

@router.get(
    "/{empresa_id}", 
    response_model=EmpresaReadDTO,
    status_code=status.HTTP_200_OK,
    summary="Obtener una empresa por ID",
    response_description="Datos detallados de la empresa solicitada"
)
async def obtener_empresa(empresa_id: int, db: AsyncSession = Depends(get_db)):
    """
    Busca una empresa específica por su identificador.
    Retorna el DTO de lectura completo incluyendo datos de auditoría y corporaciones asociadas.
    """
    emp = await empresa_service.get_empresa_by_id(db, empresa_id)
    if not emp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    return emp

@router.post(
    "/", 
    response_model=EmpresaReadDTO, 
    status_code=status.HTTP_201_CREATED,
    summary="Crear nueva empresa",
    description="Crea una nueva empresa con los datos proporcionados y la asocia con las corporaciones especificadas"
)
async def crear_empresa(empresa_data: EmpresaCreateDTO, db: AsyncSession = Depends(get_db)):
    """Alta de Empresa y asociación con corporaciones"""
    return await empresa_service.create_empresa(db, empresa_data)

@router.put(
    "/{empresa_id}", 
    response_model=EmpresaReadDTO,
    status_code=status.HTTP_200_OK,
    summary="Actualizar empresa completa",
    description="Actualización completa (PUT) - Todos los campos son obligatorios"
)
async def actualizar_empresa_completa(empresa_id: int, empresa_data: EmpresaUpdateDTO, db: AsyncSession = Depends(get_db)):
    """Actualizar datos de empresa y sus asociaciones"""
    emp = await empresa_service.update_empresa(db, empresa_id, empresa_data)
    if not emp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    return emp

@router.delete(
    "/{empresa_id}", 
    response_model=EmpresaDeleteDTO,
    status_code=status.HTTP_200_OK,
    summary="Eliminar empresa",
    description="Elimina una empresa. Por defecto realiza una baja lógica. Si hard_delete es true, elimina definitivamente del sistema."
)
async def eliminar_empresa(empresa_id: int, hard_delete: bool = False, db: AsyncSession = Depends(get_db)):
    """Baja de empresa (lógica por defecto)"""
    success = await empresa_service.delete_empresa(db, empresa_id, hard_delete)
    if not success:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    
    msg = "Empresa eliminada definitivamente" if hard_delete else "Empresa dada de baja lógicamente"
    return {"id": empresa_id, "success": True, "message": msg}
