"""Endpoints de asistencia IA (Ollama)."""
from typing import List, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth.dependencies import get_current_user
from services.ai_service import check_ollama_status, stream_chat

router = APIRouter(prefix="/ai-help", tags=["AI Help"])

_auth = [Depends(get_current_user)]


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' o 'assistant'")
    content: str


class AiChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    context: Optional[str] = Field(None, max_length=5000, description="Contexto de la página actual")
    history: Optional[List[ChatMessage]] = Field(None, max_items=20, description="Historial de mensajes previos")


@router.get("/status", dependencies=_auth)
async def ai_status():
    """Verifica disponibilidad de Ollama y modelos instalados."""
    return await check_ollama_status()


@router.post("/chat", dependencies=_auth)
async def ai_chat(body: AiChatRequest):
    """Envía una pregunta al asistente IA con streaming de respuesta."""
    return StreamingResponse(
        stream_chat(
            question=body.question,
            context=body.context,
            history=[m.model_dump() for m in body.history] if body.history else None,
        ),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
