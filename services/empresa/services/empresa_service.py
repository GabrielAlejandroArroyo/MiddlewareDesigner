import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from datetime import datetime
from typing import List, Optional
from entity.empresa_model import EmpresaModel
from dto.empresa_create_dto import EmpresaCreateDTO
from dto.empresa_update_dto import EmpresaUpdateDTO
from dto.empresa_read_dto import EmpresaReadDTO, EmpresaListDTO
from dto.empresa_delete_dto import EmpresaDeleteDTO

CORPORACION_API_URL = "http://localhost:8003/api/v1/corporaciones"

async def validate_corporacion(id_corporacion: str) -> bool:
    """Valida la existencia de la corporación en el microservicio correspondiente"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{CORPORACION_API_URL}/{id_corporacion}")
            return response.status_code == 200
        except Exception:
            return False

async def get_all_empresas(db: AsyncSession, include_baja_logica: bool = True) -> EmpresaListDTO:
    query = select(EmpresaModel)
    if not include_baja_logica:
        query = query.where(EmpresaModel.baja_logica == False)
    
    result = await db.execute(query)
    empresas = result.scalars().all()
    
    # Obtener el total
    total_query = select(func.count()).select_from(EmpresaModel)
    if not include_baja_logica:
        total_query = total_query.where(EmpresaModel.baja_logica == False)
    total_result = await db.execute(total_query)
    total = total_result.scalar()
    
    return EmpresaListDTO(
        empresa=[EmpresaReadDTO.model_validate(e) for e in empresas],
        total=total or 0
    )

async def get_empresa_by_id(db: AsyncSession, id: str) -> Optional[EmpresaModel]:
    result = await db.execute(select(EmpresaModel).where(EmpresaModel.id == id))
    return result.scalar_one_or_none()

async def create_empresa(db: AsyncSession, data: EmpresaCreateDTO) -> EmpresaModel:
    new_empresa = EmpresaModel(
        id=data.id,
        descripcion=data.descripcion,
        identificador_fiscal=data.identificador_fiscal,
        id_corporacion=data.id_corporacion
    )
    db.add(new_empresa)
    await db.commit()
    await db.refresh(new_empresa)
    return new_empresa

async def update_empresa(db: AsyncSession, id: str, data: EmpresaUpdateDTO) -> Optional[EmpresaModel]:
    empresa = await get_empresa_by_id(db, id)
    if not empresa:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(empresa, key, value)
    
    empresa.fecha_alta_modificacion = datetime.utcnow()
    await db.commit()
    await db.refresh(empresa)
    return empresa

async def delete_empresa(db: AsyncSession, id: str) -> EmpresaDeleteDTO:
    empresa = await get_empresa_by_id(db, id)
    if not empresa:
        return EmpresaDeleteDTO(id=id, success=False, mensaje="Empresa no encontrada")
    
    await db.delete(empresa)
    await db.commit()
    return EmpresaDeleteDTO(id=id, success=True, mensaje="Empresa eliminada físicamente")

async def baja_logica_empresa(db: AsyncSession, id: str) -> Optional[EmpresaModel]:
    empresa = await get_empresa_by_id(db, id)
    if not empresa:
        return None
    
    empresa.baja_logica = True
    empresa.fecha_alta_modificacion = datetime.utcnow()
    await db.commit()
    await db.refresh(empresa)
    return empresa

async def alta_logica_empresa(db: AsyncSession, id: str) -> Optional[EmpresaModel]:
    empresa = await get_empresa_by_id(db, id)
    if not empresa:
        return None
    
    empresa.baja_logica = False
    empresa.fecha_alta_modificacion = datetime.utcnow()
    await db.commit()
    await db.refresh(empresa)
    return empresa
