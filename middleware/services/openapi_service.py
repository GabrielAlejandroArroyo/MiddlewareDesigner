import httpx
from typing import Dict, List, Any

class OpenApiService:
    """Servicio para leer y parsear especificaciones OpenAPI de los microservicios"""
    
    async def fetch_spec_by_url(self, url: str) -> Dict[str, Any]:
        """Obtiene el JSON de OpenAPI desde una URL completa"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                return {"error": f"No se pudo leer el contrato en {url}: {str(e)}"}

    def extract_endpoints(self, spec: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extrae los paths y métodos disponibles del contrato"""
        endpoints = []
        paths = spec.get("paths", {})
        for path, methods in paths.items():
            for method, details in methods.items():
                endpoints.append({
                    "path": path,
                    "method": method.upper(),
                    "summary": details.get("summary", ""),
                    "operationId": details.get("operationId", "")
                })
        return endpoints
