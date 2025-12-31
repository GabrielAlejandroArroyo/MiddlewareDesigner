from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from entity.corporacion_model import Corporacion
from dto.corporacion_base_dto import CorporacionCreateDTO, CorporacionUpdateDTO
from typing import List, Optional

# --- Servicios de Corporación ---

async def get_all_corporaciones(db: AsyncSession) -> List[Corporacion]:
    result = await db.execute(select(Corporacion).where(Corporacion.baja_logica == False))
    return result.scalars().all()

async def get_corporacion_by_id(db: AsyncSession, corporacion_id: int) -> Optional[Corporacion]:
    result = await db.execute(
        select(Corporacion)
        .where(Corporacion.id == corporacion_id)
        .where(Corporacion.baja_logica == False)
    )
    return result.scalar_one_or_none()

async def create_corporacion(db: AsyncSession, corporacion_data: CorporacionCreateDTO) -> Corporacion:
    new_corp = Corporacion(**corporacion_data.model_dump())
    db.add(new_corp)
    await db.commit()
    await db.refresh(new_corp)
    return new_corp

async def update_corporacion(db: AsyncSession, corporacion_id: int, corporacion_data: CorporacionUpdateDTO) -> Optional[Corporacion]:
    corp = await get_corporacion_by_id(db, corporacion_id)
    if not corp:
        return None
    
    update_data = corporacion_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(corp, key, value)
    
    await db.commit()
    await db.refresh(corp)
    return corp

async def delete_corporacion(db: AsyncSession, corporacion_id: int, hard_delete: bool = False) -> bool:
    corp = await get_corporacion_by_id(db, corporacion_id)
    if not corp:
        # Check if it exists even if logically deleted for hard delete
        if hard_delete:
            result = await db.execute(select(Corporacion).where(Corporacion.id == corporacion_id))
            corp = result.scalar_one_or_none()
            if not corp: return False
        else:
            return False
            
    if hard_delete:
        await db.delete(corp)
    else:
        corp.baja_logica = True
        
    await db.commit()
    return True
