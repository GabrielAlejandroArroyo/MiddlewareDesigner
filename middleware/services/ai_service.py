"""Servicio de asistencia IA usando Ollama (open source, sin API keys)."""
import os
from typing import AsyncGenerator, Optional

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")

SYSTEM_PROMPT = """Eres un asistente de ayuda integrado en "Middleware Designer", una plataforma de gestión de microservicios, middlewares y microfrontends.

Tu trabajo es ayudar al usuario a entender y usar la plataforma. Responde siempre en español, de forma clara y concisa.

Funcionalidades de la plataforma:
- **Panel Principal**: Dashboard con resumen del ecosistema.
- **Gestión Backends**: Registrar y administrar microservicios backend (lectura de OpenAPI/Swagger).
- **Previsualización**: Visualizar y habilitar endpoints de los servicios registrados.
- **Aplicaciones**: Crear aplicaciones con roles, módulos por rol, menú personalizable y URL de acceso.
- **Diseño de Flujos**: Crear páginas y flujos customizados.

Estructura del ecosistema:
- Microservicios backend (Python/FastAPI): aplicacion (8005), roles (8006), usuario (8007), aplicacion-role (8008), usuario-rol (8009).
- Middleware (FastAPI, puerto 9000): orquesta contratos OpenAPI y genera modelos intermedios.
- Frontend Designer UI (Angular, puerto 4200): interfaz de administración.
- App Runtime (Angular, puerto 4201): microfrontend para las aplicaciones generadas.

Si el usuario proporciona contexto de la página actual, úsalo para dar una respuesta más relevante.
Sé breve y directo. Usa listas o pasos cuando sea apropiado.
"""


async def check_ollama_status() -> dict:
    """Verifica si Ollama está disponible y lista los modelos."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if r.status_code == 200:
                data = r.json()
                models = [m["name"] for m in data.get("models", [])]
                return {"available": True, "models": models, "current_model": OLLAMA_MODEL}
            return {"available": False, "models": [], "error": f"HTTP {r.status_code}"}
    except httpx.RequestError as e:
        return {"available": False, "models": [], "error": str(e)}


async def stream_chat(
    question: str,
    context: Optional[str] = None,
    history: Optional[list] = None,
) -> AsyncGenerator[str, None]:
    """Envía una pregunta a Ollama y genera tokens en streaming."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if history:
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

    user_content = question
    if context:
        user_content = f"[Contexto actual del usuario]\n{context}\n\n[Pregunta]\n{question}"

    messages.append({"role": "user", "content": user_content})

    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": True,
        "options": {
            "temperature": 0.7,
            "num_predict": 1024,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST", f"{OLLAMA_BASE_URL}/api/chat", json=payload
            ) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    yield f"[ERROR] Ollama respondió con HTTP {response.status_code}: {error_body.decode()}"
                    return
                import json as _json

                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    try:
                        chunk = _json.loads(line)
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            yield token
                        if chunk.get("done"):
                            break
                    except _json.JSONDecodeError:
                        continue
    except httpx.ConnectError:
        yield (
            "[ERROR] No se pudo conectar a Ollama. "
            f"Asegurate de que Ollama esté corriendo en {OLLAMA_BASE_URL}.\n\n"
            "Para instalar Ollama:\n"
            "1. Descargá desde https://ollama.com\n"
            "2. Ejecutá: `ollama pull llama3.2`\n"
            "3. Ollama se inicia automáticamente en el puerto 11434."
        )
    except httpx.RequestError as e:
        yield f"[ERROR] Error de conexión con Ollama: {e}"
