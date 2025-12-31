from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select, func
from typing import List
from datetime import datetime
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

def _service_to_dto(svc: BackendService) -> BackendServiceResponse:
    """Convierte un servicio de SQLAlchemy a DTO de forma segura"""
    try:
        svc_dict = {
            "id": str(svc.id),
            "nombre": str(svc.nombre),
            "host": str(svc.host),
            "puerto": int(svc.puerto),
            "openapi_url": str(svc.openapi_url),
            "descripcion": str(svc.descripcion) if svc.descripcion else None,
            "is_active": bool(svc.is_active),
            "baja_logica": bool(svc.baja_logica),
            "swagger_hash": None,
            "swagger_last_updated": None,
            "has_swagger_changes": None
        }
        
        # Obtener campos opcionales de forma segura
        try:
            svc_dict["swagger_hash"] = getattr(svc, 'swagger_hash', None)
        except:
            svc_dict["swagger_hash"] = None
            
        try:
            last_updated = getattr(svc, 'swagger_last_updated', None)
            if last_updated:
                svc_dict["swagger_last_updated"] = last_updated.isoformat() if hasattr(last_updated, 'isoformat') else str(last_updated)
        except:
            svc_dict["swagger_last_updated"] = None
            
        try:
            svc_dict["has_swagger_changes"] = getattr(svc, 'has_swagger_changes', None)
        except:
            svc_dict["has_swagger_changes"] = None
        
        return BackendServiceResponse(**svc_dict)
    except Exception as e:
        # Si hay error, crear un DTO mínimo
        import traceback
        print(f"Error al convertir servicio a DTO: {e}")
        traceback.print_exc()
        return BackendServiceResponse(
            id=str(svc.id),
            nombre=str(svc.nombre),
            host=str(svc.host),
            puerto=int(svc.puerto),
            openapi_url=str(svc.openapi_url),
            descripcion=str(svc.descripcion) if svc.descripcion else None,
            is_active=bool(svc.is_active),
            baja_logica=bool(svc.baja_logica)
        )

# --- ABM Microbackends ---

@router.post("/backend-services", response_model=BackendServiceResponse)
async def create_backend_service(data: BackendServiceCreate):
    async with AsyncSessionLocal() as session:
        # Normalizar ID a minúsculas para evitar problemas de matching
        service_id = data.id.lower().strip()
        
        existing = await session.get(BackendService, service_id)
        if existing:
            if existing.baja_logica:
                # Reactivar servicio en baja lógica
                existing.baja_logica = False
                # Actualizar datos del servicio
                try:
                    parsed_url = urlparse(data.openapi_url)
                    host = f"{parsed_url.scheme}://{parsed_url.hostname}"
                    puerto = parsed_url.port or (80 if parsed_url.scheme == "http" else 443)
                except Exception:
                    raise HTTPException(status_code=400, detail="URL de OpenAPI invalida")
                
                spec = await openapi_service.fetch_spec_by_url(data.openapi_url)
                if "error" in spec:
                    raise HTTPException(status_code=400, detail=spec["error"])
                
                nombre_servicio = spec.get("info", {}).get("title", data.id)
                swagger_hash = openapi_service.calculate_swagger_hash(spec)
                
                existing.nombre = nombre_servicio
                existing.host = host
                existing.puerto = puerto
                existing.openapi_url = data.openapi_url
                existing.descripcion = data.descripcion
                existing.swagger_hash = swagger_hash
                existing.swagger_last_updated = datetime.utcnow()
                existing.swagger_spec_cached = spec
                
                await session.commit()
                await session.refresh(existing)
                return existing
            else:
                # Servicio activo: actualizar Swagger y datos si la URL cambió
                try:
                    parsed_url = urlparse(data.openapi_url)
                    host = f"{parsed_url.scheme}://{parsed_url.hostname}"
                    puerto = parsed_url.port or (80 if parsed_url.scheme == "http" else 443)
                except Exception:
                    raise HTTPException(status_code=400, detail="URL de OpenAPI invalida")
                
                spec = await openapi_service.fetch_spec_by_url(data.openapi_url)
                if "error" in spec:
                    raise HTTPException(status_code=400, detail=spec["error"])
                
                nombre_servicio = spec.get("info", {}).get("title", data.id)
                swagger_hash = openapi_service.calculate_swagger_hash(spec)
                
                # Actualizar datos del servicio existente
                existing.nombre = nombre_servicio
                existing.host = host
                existing.puerto = puerto
                existing.openapi_url = data.openapi_url
                if data.descripcion:
                    existing.descripcion = data.descripcion
                existing.swagger_hash = swagger_hash
                existing.swagger_last_updated = datetime.utcnow()
                existing.swagger_spec_cached = spec
                
                await session.commit()
                await session.refresh(existing)
                return existing

        try:
            parsed_url = urlparse(data.openapi_url)
            host = f"{parsed_url.scheme}://{parsed_url.hostname}"
            puerto = parsed_url.port or (80 if parsed_url.scheme == "http" else 443)
        except Exception:
            raise HTTPException(status_code=400, detail="URL de OpenAPI invalida")

        spec = await openapi_service.fetch_spec_by_url(data.openapi_url)
        if "error" in spec:
            raise HTTPException(status_code=400, detail=spec["error"])
        
        nombre_servicio = spec.get("info", {}).get("title", data.id)
        swagger_hash = openapi_service.calculate_swagger_hash(spec)

        new_svc = BackendService(
            id=service_id,
            nombre=nombre_servicio,
            host=host,
            puerto=puerto,
            openapi_url=data.openapi_url,
            descripcion=data.descripcion,
            swagger_hash=swagger_hash,
            swagger_last_updated=datetime.utcnow(),
            swagger_spec_cached=spec
        )
        
        session.add(new_svc)
        await session.commit()
        await session.refresh(new_svc)
        return new_svc

@router.get("/backend-services", response_model=List[BackendServiceResponse])
async def list_backend_services(include_deleted: bool = False, check_changes: bool = Query(False, description="Verificar cambios en Swagger para cada servicio")):
    try:
        async with AsyncSessionLocal() as session:
            query = select(BackendService)
            if not include_deleted:
                query = query.where(BackendService.baja_logica == False)
            result = await session.execute(query)
            services = result.scalars().all()
            
            # Si se solicita, verificar cambios para cada servicio
            if check_changes:
                services_with_changes = []
                for svc in services:
                    try:
                        current_spec = await openapi_service.fetch_spec_by_url(svc.openapi_url)
                        if "error" not in current_spec:
                            current_hash = openapi_service.calculate_swagger_hash(current_spec)
                            # Manejar el caso donde swagger_hash puede ser None (servicios antiguos)
                            stored_hash = getattr(svc, 'swagger_hash', None)
                            has_changes = stored_hash is None or stored_hash != current_hash
                            # Asignar como atributo dinámico para el DTO
                            svc.has_swagger_changes = has_changes
                        else:
                            svc.has_swagger_changes = None
                    except Exception as e:
                        # En caso de error, no marcar cambios
                        svc.has_swagger_changes = None
                    services_with_changes.append(svc)
                # Convertir a DTOs de forma segura
                result_list = []
                for svc_item in services_with_changes:
                    try:
                        result_list.append(_service_to_dto(svc_item))
                    except Exception as e:
                        print(f"Error al convertir servicio {svc_item.id}: {e}")
                        continue
                return result_list
            
            # Convertir a DTOs de forma segura
            result_list = []
            for svc_item in services:
                try:
                    result_list.append(_service_to_dto(svc_item))
                except Exception as e:
                    print(f"Error al convertir servicio {svc_item.id}: {e}")
                    continue
            return result_list
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al listar servicios: {str(e)}")


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

@router.patch("/backend-services/{service_id}/alta-logica")
async def reactivate_backend_service(service_id: str):
    """Reactiva un backend que estaba en baja lógica"""
    async with AsyncSessionLocal() as session:
        search_id = service_id.lower().strip()
        svc = await session.get(BackendService, search_id)
        
        if not svc:
            raise HTTPException(status_code=404, detail=f"Servicio '{search_id}' no encontrado")

        svc.baja_logica = False
        await session.commit()
        return {"status": "success", "message": f"Servicio '{svc.id}' reactivado correctamente"}

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
        
        # Verificar cambios en el Swagger
        # Manejar el caso donde swagger_hash puede ser None (servicios antiguos)
        current_hash = openapi_service.calculate_swagger_hash(spec)
        stored_hash = getattr(svc, 'swagger_hash', None)
        has_changes = stored_hash is None or stored_hash != current_hash
        
        # Obtener mapeos existentes para este backend
        mappings_query = select(BackendMapping).where(BackendMapping.backend_service_id == search_id)
        mappings_result = await session.execute(mappings_query)
        active_mappings = {f"{m.metodo}:{m.endpoint_path}": m.configuracion_ui for m in mappings_result.scalars().all()}
        
        endpoints = openapi_service.extract_endpoints(spec)
        
        # Enriquecer endpoints con estado de habilitación
        for ep in endpoints:
            key = f"{ep['method']}:{ep['path']}"
            ep["is_enabled"] = key in active_mappings
            ep["configuracion_ui"] = active_mappings.get(key, {})

        # Obtener valores de swagger de forma segura (ya obtenidos arriba)
        last_updated = getattr(svc, 'swagger_last_updated', None)
        last_updated_str = last_updated.isoformat() if last_updated else None
        
        return {
            "service_id": svc.id,
            "service_name": spec.get("info", {}).get("title", svc.nombre),
            "endpoints": endpoints,
            "swagger_info": {
                "has_changes": has_changes,
                "current_hash": current_hash,
                "stored_hash": stored_hash,
                "last_updated": last_updated_str
            }
        }

@router.post("/mappings/toggle")
async def toggle_endpoint_mapping(data: BackendMappingCreate):
    """Habilita o actualiza un mapeo de endpoint. Si ya existe, lo actualiza."""
    async with AsyncSessionLocal() as session:
        # Buscar mapeo existente
        query = select(BackendMapping).where(
            BackendMapping.backend_service_id == data.backend_service_id,
            BackendMapping.endpoint_path == data.endpoint_path,
            BackendMapping.metodo == data.metodo,
            BackendMapping.frontend_service_id == data.frontend_service_id
        )
        result = await session.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            # Actualizar configuración
            existing.configuracion_ui = data.configuracion_ui
            mensaje = "Configuración de endpoint actualizada"
        else:
            # Crear nuevo mapeo
            new_mapping = BackendMapping(**data.model_dump())
            session.add(new_mapping)
            mensaje = "Endpoint habilitado correctamente"
        
        await session.commit()
        return {"status": "success", "message": mensaje}

@router.delete("/mappings")
async def remove_endpoint_mapping(
    backend_service_id: str, 
    endpoint_path: str, 
    metodo: str, 
    frontend_service_id: str = "default"
):
    """Deshabilita un endpoint (elimina el mapeo)"""
    async with AsyncSessionLocal() as session:
        query = select(BackendMapping).where(
            BackendMapping.backend_service_id == backend_service_id,
            BackendMapping.endpoint_path == endpoint_path,
            BackendMapping.metodo == metodo,
            BackendMapping.frontend_service_id == frontend_service_id
        )
        result = await session.execute(query)
        mapping = result.scalar_one_or_none()

        if not mapping:
            raise HTTPException(status_code=404, detail="Mapeo no encontrado")

        await session.delete(mapping)
        await session.commit()
        return {"status": "success", "message": "Endpoint deshabilitado"}

@router.get("/backend-services/{service_id}/check-changes")
async def check_swagger_changes(service_id: str):
    """Verifica si hay cambios en el Swagger del servicio sin aplicar"""
    async with AsyncSessionLocal() as session:
        search_id = service_id.lower().strip()
        svc = await session.get(BackendService, search_id)
        
        if not svc or svc.baja_logica:
            raise HTTPException(status_code=404, detail="Microbackend no encontrado o dado de baja")
        
        # Obtener Swagger actual
        current_spec = await openapi_service.fetch_spec_by_url(svc.openapi_url)
        if "error" in current_spec:
            raise HTTPException(status_code=400, detail=current_spec["error"])
        
        current_hash = openapi_service.calculate_swagger_hash(current_spec)
        # Manejar el caso donde swagger_hash puede ser None (servicios antiguos)
        stored_hash = getattr(svc, 'swagger_hash', None)
        has_changes = stored_hash is None or stored_hash != current_hash
        last_updated = getattr(svc, 'swagger_last_updated', None)
        last_updated_str = last_updated.isoformat() if last_updated else None
        
        return {
            "service_id": svc.id,
            "has_changes": has_changes,
            "current_hash": current_hash,
            "stored_hash": stored_hash,
            "last_updated": last_updated_str,
            "message": "Hay cambios sin aplicar en el Swagger" if has_changes else "El Swagger esta actualizado"
        }

@router.post("/backend-services/{service_id}/refresh-swagger")
async def refresh_swagger(service_id: str, preserve_config: bool = Query(True, description="Conservar la configuración actual de endpoints")):
    """Actualiza el Swagger del servicio conservando la configuración existente"""
    async with AsyncSessionLocal() as session:
        search_id = service_id.lower().strip()
        svc = await session.get(BackendService, search_id)
        
        if not svc or svc.baja_logica:
            raise HTTPException(status_code=404, detail="Microbackend no encontrado o dado de baja")
        
        # Obtener Swagger actual
        new_spec = await openapi_service.fetch_spec_by_url(svc.openapi_url)
        if "error" in new_spec:
            raise HTTPException(status_code=400, detail=new_spec["error"])
        
        new_hash = openapi_service.calculate_swagger_hash(new_spec)
        
        # Inicializar contadores
        preserved_count = 0
        removed_count = 0
        
        # Si preserve_config es True, conservar los mapeos existentes
        if preserve_config:
            # Obtener todos los mapeos existentes para este servicio
            mappings_query = select(BackendMapping).where(BackendMapping.backend_service_id == search_id)
            mappings_result = await session.execute(mappings_query)
            existing_mappings = mappings_result.scalars().all()
            
            # Extraer endpoints del nuevo Swagger
            new_endpoints = openapi_service.extract_endpoints(new_spec)
            new_endpoints_dict = {f"{ep['method']}:{ep['path']}": ep for ep in new_endpoints}
            
            # Verificar que los endpoints configurados aún existan
            for mapping in existing_mappings:
                endpoint_key = f"{mapping.metodo}:{mapping.endpoint_path}"
                if endpoint_key in new_endpoints_dict:
                    preserved_count += 1
                else:
                    # El endpoint ya no existe en el nuevo Swagger
                    removed_count += 1
                    # Marcar como deshabilitado pero no eliminar
                    mapping.configuracion_ui = mapping.configuracion_ui or {}
                    mapping.configuracion_ui["_deprecated"] = True
                    mapping.configuracion_ui["_deprecated_reason"] = "Endpoint ya no existe en el Swagger actualizado"
        
        # Actualizar el servicio con el nuevo Swagger
        svc.swagger_hash = new_hash
        svc.swagger_last_updated = datetime.utcnow()
        svc.swagger_spec_cached = new_spec
        
        # Actualizar nombre si cambió
        new_nombre = new_spec.get("info", {}).get("title", svc.nombre)
        if new_nombre != svc.nombre:
            svc.nombre = new_nombre
        
        await session.commit()
        
        return {
            "status": "success",
            "message": "Swagger actualizado correctamente",
            "service_id": svc.id,
            "new_hash": new_hash,
            "preserved_mappings": preserved_count if preserve_config else None,
            "removed_endpoints": removed_count if preserve_config else None
        }
