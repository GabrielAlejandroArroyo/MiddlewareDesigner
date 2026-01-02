from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from entity.corporacion_model import Corporacion
from dto.corporacion_base_dto import CorporacionCreateDTO, CorporacionUpdateDTO, CorporacionReadDTO, CorporacionListDTO
from typing import List, Optional

# --- Servicios de Corporación ---

async def get_all_corporaciones(db: AsyncSession, include_baja_logica: bool = True) -> CorporacionListDTO:
    query = select(Corporacion)
    if not include_baja_logica:
        query = query.where(Corporacion.baja_logica == False)
    
    result = await db.execute(query)
    corporaciones = result.scalars().all()
    
    dtos = [CorporacionReadDTO.model_validate(c) for c in corporaciones]
    return CorporacionListDTO(corporaciones=dtos, total=len(dtos))

async def get_corporacion_by_id(db: AsyncSession, corporacion_id: int) -> Optional[CorporacionReadDTO]:
    result = await db.execute(
        select(Corporacion)
        .where(Corporacion.id == corporacion_id)
        .where(Corporacion.baja_logica == False)
    )
    corp = result.scalar_one_or_none()
    if not corp:
        return None
    return CorporacionReadDTO.model_validate(corp)

async def create_corporacion(db: AsyncSession, corporacion_data: CorporacionCreateDTO) -> CorporacionReadDTO:
    new_corp = Corporacion(**corporacion_data.model_dump())
    db.add(new_corp)
    await db.commit()
    await db.refresh(new_corp)
    return CorporacionReadDTO.model_validate(new_corp)

async def update_corporacion(db: AsyncSession, corporacion_id: int, corporacion_data: CorporacionUpdateDTO) -> Optional[CorporacionReadDTO]:
    result = await db.execute(
        select(Corporacion)
        .where(Corporacion.id == corporacion_id)
        .where(Corporacion.baja_logica == False)
    )
    corp = result.scalar_one_or_none()
    if not corp:
        return None
    
    update_data = corporacion_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(corp, key, value)
    
    await db.commit()
    await db.refresh(corp)
    return CorporacionReadDTO.model_validate(corp)

async def delete_corporacion(db: AsyncSession, corporacion_id: int, hard_delete: bool = False) -> bool:
    result = await db.execute(select(Corporacion).where(Corporacion.id == corporacion_id))
    corp = result.scalar_one_or_none()
    if not corp:
        return False
    
    if hard_delete:
        await db.delete(corp)
    else:
        corp.baja_logica = True
        
    await db.commit()
    return True
