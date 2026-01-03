import httpx
import hashlib
import json
from typing import Dict, List, Any, Optional

class OpenApiService:
    """Servicio para leer y parsear especificaciones OpenAPI de los microservicios"""
    
    def calculate_swagger_hash(self, spec: Dict[str, Any]) -> str:
        """Calcula un hash MD5 del Swagger para detectar cambios"""
        # Normalizar el JSON (ordenar claves) para que el hash sea consistente
        spec_str = json.dumps(spec, sort_keys=True, separators=(',', ':'))
        return hashlib.md5(spec_str.encode('utf-8')).hexdigest()
    
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

    def _resolve_schema(self, schema_ref: Dict[str, Any], all_schemas: Dict[str, Any], depth: int = 0) -> Dict[str, Any]:
        """Resuelve una referencia $ref o devuelve el esquema si es inline, con soporte para anidamiento"""
        if depth > 20: return {"name": "LimitReached", "properties": {}, "type": "object"}

        # Caso 1: Es una referencia directa
        if "$ref" in schema_ref:
            ref_path = schema_ref["$ref"]
            schema_name = ref_path.split("/")[-1]
            schema_content = all_schemas.get(schema_name, {})
            resolved = self._resolve_schema(schema_content, all_schemas, depth + 1)
            resolved["name"] = schema_name
            return resolved
        
        # Caso especial: allOf (Herencia) - FUSION TOTAL
        if "allOf" in schema_ref:
            combined_props = {}
            combined_required = []
            name = schema_ref.get("title") or schema_ref.get("name")
            
            for sub_schema in schema_ref["allOf"]:
                resolved_sub = self._resolve_schema(sub_schema, all_schemas, depth + 1)
                if "properties" in resolved_sub:
                    for k, v in resolved_sub["properties"].items():
                        clean_key = str(k).strip()
                        combined_props[clean_key] = v
                if "required" in resolved_sub:
                    combined_required.extend(resolved_sub["required"])
                if not name and resolved_sub.get("name"):
                    name = resolved_sub.get("name")

            return {
                "name": name or "ObjectDTO",
                "type": "object",
                "properties": combined_props,
                "required": list(set(combined_required))
            }

        # Caso especial: anyOf / oneOf (Tomar el primero que no sea null)
        for selector in ["anyOf", "oneOf"]:
            if selector in schema_ref:
                for opt in schema_ref[selector]:
                    if opt.get("type") != "null":
                        return self._resolve_schema(opt, all_schemas, depth + 1)

        # Objeto estándar
        if "properties" in schema_ref or schema_ref.get("type") == "object":
            resolved_props = {}
            props = schema_ref.get("properties", {})
            for p_name, p_val in props.items():
                clean_name = str(p_name).strip()
                resolved_props[clean_name] = self._resolve_property(p_val, all_schemas, depth + 1)

            return {
                "name": schema_ref.get("title") or schema_ref.get("name") or "ObjectDTO",
                "type": "object",
                "properties": resolved_props,
                "required": schema_ref.get("required", [])
            }

        # Array
        if schema_ref.get("type") == "array":
            items_ref = schema_ref.get("items", {})
            resolved_items = self._resolve_schema(items_ref, all_schemas, depth + 1)
            return {
                "name": f"{resolved_items.get('name', 'Item')}[]",
                "type": "array",
                "items": resolved_items
            }

        # Tipo primitivo
        return {
            "type": schema_ref.get("type", "string"),
            "name": schema_ref.get("title") or schema_ref.get("name") or schema_ref.get("type", "string"),
            "format": schema_ref.get("format"),
            "description": schema_ref.get("description", "")
        }

    def _resolve_property(self, prop_val: Dict[str, Any], all_schemas: Dict[str, Any], depth: int) -> Dict[str, Any]:
        """Resuelve el tipo de una propiedad individual"""
        if not isinstance(prop_val, dict):
            return {"type": "any", "name": "any"}

        if "$ref" in prop_val:
            return self._resolve_schema(prop_val, all_schemas, depth)
        
        # Caso especial: anyOf / oneOf en propiedades
        for selector in ["anyOf", "oneOf"]:
            if selector in prop_val:
                for opt in prop_val[selector]:
                    if opt.get("type") != "null":
                        res = self._resolve_property(opt, all_schemas, depth)
                        if "title" in prop_val: res["title"] = prop_val["title"]
                        if "description" in prop_val: res["description"] = prop_val["description"]
                        return res

        if prop_val.get("type") == "array":
            item_schema = self._resolve_schema(prop_val.get("items", {}), all_schemas, depth)
            return {
                "type": "array",
                "items": item_schema,
                "name": f"{item_schema.get('name', 'any')}[]",
                "title": prop_val.get("title"),
                "description": prop_val.get("description")
            }
        
        res = prop_val.copy()
        res["name"] = res.get("title") or res.get("name") or res.get("type", "string")
        return res
