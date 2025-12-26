import httpx
from typing import Dict, List, Any

class OpenApiService:
    """Servicio para leer y parsear especificaciones OpenAPI de los microservicios"""
    
    async def fetch_spec_by_url(self, url: str) -> Dict[str, Any]:
        """Obtiene el JSON de OpenAPI desde una URL completa"""
        # Correccion automatica: si el usuario pasa la URL de docs, cambiar a openapi.json
        if url.endswith("/docs"):
            url = url.replace("/docs", "/openapi.json")
        elif url.endswith("/docs/"):
            url = url.replace("/docs/", "/openapi.json")
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                return {"error": f"No se pudo leer el contrato en {url}: {str(e)}"}

    def extract_endpoints(self, spec: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extrae los paths, métodos, parámetros y DTOs disponibles del contrato"""
        endpoints = []
        paths = spec.get("paths", {})
        schemas = spec.get("components", {}).get("schemas", {})

        for path, methods in paths.items():
            for method, details in methods.items():
                # Extraer parámetros (path, query, header, cookie)
                parameters = details.get("parameters", [])
                
                # Extraer Request DTO (si existe)
                request_dto = None
                request_body = details.get("requestBody", {})
                content = request_body.get("content", {})
                json_content = content.get("application/json", {})
                schema_ref = json_content.get("schema", {})
                
                if schema_ref:
                    request_dto = self._resolve_schema(schema_ref, schemas)

                # Extraer Response DTO (200 OK o 201 Created)
                response_dto = None
                responses = details.get("responses", {})
                success_response = responses.get("200") or responses.get("201")
                if success_response:
                    resp_content = success_response.get("content", {})
                    resp_json = resp_content.get("application/json", {})
                    resp_schema = resp_json.get("schema", {})
                    if resp_schema:
                        response_dto = self._resolve_schema(resp_schema, schemas)

                endpoints.append({
                    "path": path,
                    "method": method.upper(),
                    "summary": details.get("summary", ""),
                    "operationId": details.get("operationId", ""),
                    "parameters": parameters,
                    "request_dto": request_dto,
                    "response_dto": response_dto
                })
        return endpoints

    def _resolve_schema(self, schema_ref: Dict[str, Any], all_schemas: Dict[str, Any]) -> Dict[str, Any]:
        """Resuelve una referencia $ref o devuelve el esquema si es inline"""
        if "$ref" in schema_ref:
            ref_path = schema_ref["$ref"]
            schema_name = ref_path.split("/")[-1]
            schema_content = all_schemas.get(schema_name, {})
            return {
                "name": schema_name,
                "properties": schema_content.get("properties", {}),
                "required": schema_content.get("required", [])
            }
        
        return {
            "name": "InlineSchema",
            "properties": schema_ref.get("properties", {}),
            "required": schema_ref.get("required", [])
        }
