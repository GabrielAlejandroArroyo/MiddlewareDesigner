from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, insert
from entity.empresa_model import Empresa, empresa_corporacion
from dto.empresa_base_dto import EmpresaCreateDTO, EmpresaUpdateDTO, EmpresaReadDTO
from typing import List, Optional

async def get_all_empresas(db: AsyncSession) -> List[EmpresaReadDTO]:
    result = await db.execute(select(Empresa).where(Empresa.baja_logica == False))
    empresas = result.scalars().all()
    
    output = []
    for emp in empresas:
        # Obtener IDs de corporaciones asociadas
        corp_result = await db.execute(
            select(empresa_corporacion.c.id_corporacion).where(empresa_corporacion.c.id_empresa == emp.id)
        )
        corp_ids = [row[0] for row in corp_result.fetchall()]
        
        emp_dto = EmpresaReadDTO(
            id=emp.id,
            descripcion=emp.descripcion,
            baja_logica=emp.baja_logica,
            fecha_alta=emp.fecha_alta,
            fecha_modificacion=emp.fecha_modificacion,
            corporaciones_ids=corp_ids
        )
        output.append(emp_dto)
    return output

async def get_empresa_by_id(db: AsyncSession, empresa_id: int) -> Optional[EmpresaReadDTO]:
    result = await db.execute(
        select(Empresa)
        .where(Empresa.id == empresa_id)
        .where(Empresa.baja_logica == False)
    )
    emp = result.scalar_one_or_none()
    if not emp: return None
    
    corp_result = await db.execute(
        select(empresa_corporacion.c.id_corporacion).where(empresa_corporacion.c.id_empresa == emp.id)
    )
    corp_ids = [row[0] for row in corp_result.fetchall()]
    
    return EmpresaReadDTO(
        id=emp.id,
        descripcion=emp.descripcion,
        baja_logica=emp.baja_logica,
        fecha_alta=emp.fecha_alta,
        fecha_modificacion=emp.fecha_modificacion,
        corporaciones_ids=corp_ids
    )

async def create_empresa(db: AsyncSession, empresa_data: EmpresaCreateDTO) -> EmpresaReadDTO:
    data = empresa_data.model_dump()
    corp_ids = data.pop("corporaciones_ids", [])
    
    new_emp = Empresa(**data)
    db.add(new_emp)
    await db.flush() # Para obtener el ID
    
    # Asociar corporaciones
    for corp_id in corp_ids:
        await db.execute(
            insert(empresa_corporacion).values(id_empresa=new_emp.id, id_corporacion=corp_id)
        )
    
    await db.commit()
    empresa_result = await get_empresa_by_id(db, new_emp.id)
    if not empresa_result:
        raise ValueError("Error al crear empresa")
    return empresa_result

async def update_empresa(db: AsyncSession, empresa_id: int, empresa_data: EmpresaUpdateDTO) -> Optional[EmpresaReadDTO]:
    result = await db.execute(select(Empresa).where(Empresa.id == empresa_id))
    emp = result.scalar_one_or_none()
    if not emp: return None
    
    data = empresa_data.model_dump(exclude_unset=True)
    corp_ids = data.pop("corporaciones_ids", None)
    
    for key, value in data.items():
        setattr(emp, key, value)
    
    if corp_ids is not None:
        # Limpiar asociaciones anteriores
        await db.execute(delete(empresa_corporacion).where(empresa_corporacion.c.id_empresa == empresa_id))
        # Agregar nuevas
        for corp_id in corp_ids:
            await db.execute(
                insert(empresa_corporacion).values(id_empresa=empresa_id, id_corporacion=corp_id)
            )
            
    await db.commit()
    return await get_empresa_by_id(db, empresa_id)

async def delete_empresa(db: AsyncSession, empresa_id: int, hard_delete: bool = False) -> bool:
    result = await db.execute(select(Empresa).where(Empresa.id == empresa_id))
    emp = result.scalar_one_or_none()
    if not emp: return False
    
    if hard_delete:
        await db.execute(delete(empresa_corporacion).where(empresa_corporacion.c.id_empresa == empresa_id))
        await db.delete(emp)
    else:
        emp.baja_logica = True
        
    await db.commit()
    return True
