from fastapi import APIRouter, HTTPException
from sqlalchemy import select
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
        # Extraer host y puerto de la URL de OpenAPI
        try:
            parsed_url = urlparse(data.openapi_url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise ValueError("URL invalida")
            
            host = f"{parsed_url.scheme}://{parsed_url.hostname}"
            puerto = parsed_url.port or (80 if parsed_url.scheme == "http" else 443)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"No se pudo procesar la URL de OpenAPI: {str(e)}")

        # Intentar obtener el nombre del servicio desde el contrato
        spec = await openapi_service.fetch_spec_by_url(data.openapi_url)
        if "error" in spec:
            nombre_servicio = data.id # Fallback al ID si no se puede leer el contrato ahora
        else:
            nombre_servicio = spec.get("info", {}).get("title", data.id)

        new_svc = BackendService(
            id=data.id,
            nombre=nombre_servicio,
            host=host,
            puerto=puerto,
            openapi_url=data.openapi_url,
            descripcion=data.descripcion,
            is_active=data.is_active
        )
        
        session.add(new_svc)
        await session.commit()
        await session.refresh(new_svc)
        return new_svc

@router.get("/backend-services", response_model=List[BackendServiceResponse])
async def list_backend_services():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(BackendService))
        return result.scalars().all()

@router.get("/backend-services/{service_id}/inspect")
async def inspect_backend_service(service_id: str):
    """Analiza automáticamente el contrato OpenAPI de un backend registrado usando su URL guardada"""
    async with AsyncSessionLocal() as session:
        query = select(BackendService).where(BackendService.id == service_id)
        result = await session.execute(query)
        svc = result.scalar_one_or_none()
        
        if not svc:
            raise HTTPException(status_code=404, detail="Microbackend no encontrado")
        
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
