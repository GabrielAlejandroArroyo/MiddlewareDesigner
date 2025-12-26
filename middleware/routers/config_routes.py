from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func
from typing import List
from urllib.parse import urlparse
from config.database import AsyncSessionLocal
from entity.config_models import FrontendService, BackendMapping, BackendService
from dto.config_dtos import (
    FrontendServiceCreate, FrontendServiceResponse, 
    BackendMappingCreate, BackendServiceCreate, BackendServiceResponse
)
from services.openapi_service import OpenApiService

router = APIRouter(prefix="/config", tags=["Middleware Configuration"])
openapi_service = OpenApiService()

# --- ABM Microbackends ---

@router.post("/backend-services", response_model=BackendServiceResponse)
async def create_backend_service(data: BackendServiceCreate):
    async with AsyncSessionLocal() as session:
        # Normalizar ID a minúsculas para evitar problemas de matching
        service_id = data.id.lower().strip()
        
        existing = await session.get(BackendService, service_id)
        if existing:
            if existing.baja_logica:
                existing.baja_logica = False
                await session.commit()
                await session.refresh(existing)
                return existing
            raise HTTPException(status_code=409, detail=f"El ID '{service_id}' ya esta registrado")

        try:
            parsed_url = urlparse(data.openapi_url)
            host = f"{parsed_url.scheme}://{parsed_url.hostname}"
            puerto = parsed_url.port or (80 if parsed_url.scheme == "http" else 443)
        except Exception:
            raise HTTPException(status_code=400, detail="URL de OpenAPI invalida")

        spec = await openapi_service.fetch_spec_by_url(data.openapi_url)
        nombre_servicio = spec.get("info", {}).get("title", data.id) if "error" not in spec else data.id

        new_svc = BackendService(
            id=service_id,
            nombre=nombre_servicio,
            host=host,
            puerto=puerto,
            openapi_url=data.openapi_url,
            descripcion=data.descripcion
        )
        
        session.add(new_svc)
        await session.commit()
        await session.refresh(new_svc)
        return new_svc

@router.get("/backend-services", response_model=List[BackendServiceResponse])
async def list_backend_services(include_deleted: bool = False):
    async with AsyncSessionLocal() as session:
        query = select(BackendService)
        if not include_deleted:
            query = query.where(BackendService.baja_logica == False)
        result = await session.execute(query)
        return result.scalars().all()

@router.delete("/backend-services/{service_id}")
async def delete_backend_service(service_id: str, physical: bool = Query(False)):
    """Elimina un backend. Si physical=True, valida que no tenga referencias."""
    async with AsyncSessionLocal() as session:
        # Buscar el servicio (el ID en DB es lowercase)
        search_id = service_id.lower().strip()
        svc = await session.get(BackendService, search_id)
        
        if not svc:
            raise HTTPException(status_code=404, detail=f"Servicio con ID '{search_id}' no encontrado en la base de datos")

        if physical:
            # Validar referencias en BackendMapping
            ref_query = select(func.count()).select_from(BackendMapping).where(BackendMapping.backend_service_id == search_id)
            result = await session.execute(ref_query)
            count = result.scalar()
            if count > 0:
                raise HTTPException(
                    status_code=400, 
                    detail=f"No se puede eliminar definitivamente: existen {count} mapeos configurados para este servicio."
                )
            
            await session.delete(svc)
            mensaje = "Servicio eliminado definitivamente de la base de datos."
        else:
            svc.baja_logica = True
            mensaje = "Servicio dado de baja logicamente."
        
        await session.commit()
        return {"status": "success", "message": mensaje}

@router.get("/backend-services/{service_id}/inspect")
async def inspect_backend_service(service_id: str):
    async with AsyncSessionLocal() as session:
        search_id = service_id.lower().strip()
        svc = await session.get(BackendService, search_id)
        if not svc or svc.baja_logica:
            raise HTTPException(status_code=404, detail="Microbackend no encontrado o dado de baja")
        
        spec = await openapi_service.fetch_spec_by_url(svc.openapi_url)
        if "error" in spec:
            raise HTTPException(status_code=400, detail=spec["error"])
        
        return {
            "service_id": svc.id,
            "service_name": spec.get("info", {}).get("title", svc.nombre),
            "endpoints": openapi_service.extract_endpoints(spec)
        }

# --- ABM Microfrontends ---

@router.post("/frontend-services", response_model=FrontendServiceResponse)
async def create_frontend_service(data: FrontendServiceCreate):
    async with AsyncSessionLocal() as session:
        new_svc = FrontendService(**data.model_dump())
        session.add(new_svc)
        await session.commit()
        await session.refresh(new_svc)
        return new_svc

@router.post("/mappings")
async def add_backend_mapping(data: BackendMappingCreate):
    async with AsyncSessionLocal() as session:
        new_mapping = BackendMapping(**data.model_dump())
        session.add(new_mapping)
        await session.commit()
        return {"status": "success", "mapping_id": new_mapping.id}
