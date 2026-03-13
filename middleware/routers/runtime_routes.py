"""Rutas públicas del runtime: proxy a backends para evitar CORS."""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy import select
from config.database import AsyncSessionLocal
from entity.config_models import BackendService
import httpx

router = APIRouter(
    prefix="/runtime",
    tags=["Runtime Proxy"],
)


async def _get_backend_url(service_id: str) -> str:
    """Obtiene la URL base del backend a partir del service_id."""
    async with AsyncSessionLocal() as session:
        svc = await session.get(BackendService, service_id)
        if not svc or svc.baja_logica:
            raise HTTPException(status_code=404, detail=f"Servicio backend '{service_id}' no encontrado")
        base = str(svc.host).strip()
        if not base.startswith("http"):
            base = f"http://{base}"
        port = int(svc.puerto)
        return f"{base}:{port}"


@router.api_route("/proxy/{service_id}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_to_backend(service_id: str, path: str, request: Request):
    """
    Reenvía la petición al microservicio backend. Evita CORS al hacer las
    peticiones desde el mismo origen (middleware).
    """
    base_url = await _get_backend_url(service_id)
    path = path if path.startswith("/") else f"/{path}"
    url = f"{base_url.rstrip('/')}{path}"
    query = str(request.url.query) or ""
    if query:
        url = f"{url}?{query}"

    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")}
    body = await request.body()

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
        )
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers={k: v for k, v in resp.headers.items() if k.lower() not in ("content-encoding", "transfer-encoding")},
        media_type=resp.headers.get("content-type"),
    )
