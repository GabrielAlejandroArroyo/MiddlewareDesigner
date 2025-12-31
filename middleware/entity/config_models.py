from sqlalchemy import String, Boolean, JSON, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from typing import Optional, Dict
from config.database import Base

class BackendService(Base):
    """Microservicios backend registrados para ser analizados"""
    __tablename__ = "backend_services"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    host: Mapped[str] = mapped_column(String(255), nullable=False)
    puerto: Mapped[int] = mapped_column(Integer, nullable=False)
    openapi_url: Mapped[str] = mapped_column(String(500), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(500))
    baja_logica: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    swagger_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, default=None)
    swagger_last_updated: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
    swagger_spec_cached: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True, default=None)

class FrontendService(Base):
    """Representa un microfrontend o módulo de UI configurado"""
    __tablename__ = "frontend_services"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class BackendMapping(Base):
    """Configuración de qué endpoints de backend están habilitados para un frontend"""
    __tablename__ = "backend_mappings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    frontend_service_id: Mapped[str] = mapped_column(String(50), nullable=False)
    backend_service_id: Mapped[str] = mapped_column(String(50), nullable=False)
    endpoint_path: Mapped[str] = mapped_column(String(255), nullable=False)
    metodo: Mapped[str] = mapped_column(String(10), nullable=False)
    configuracion_ui: Mapped[Dict] = mapped_column(JSON, default=dict)
