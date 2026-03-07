from datetime import datetime as dt
from sqlalchemy import String, Boolean, JSON, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import Optional, Dict, List
from config.database import Base


class AppDefinition(Base):
    """Definición de una aplicación configurada en el designer"""
    __tablename__ = "app_definitions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_aplicacion: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(String(500))
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    baja_logica: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[Optional[dt]] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[dt]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    roles: Mapped[List["AppRoleConfig"]] = relationship(
        back_populates="app_definition", cascade="all, delete-orphan", lazy="selectin"
    )
    menu_config: Mapped[Optional["AppMenuConfig"]] = relationship(
        back_populates="app_definition", cascade="all, delete-orphan", uselist=False, lazy="selectin"
    )


class AppRoleConfig(Base):
    """Roles asignados a una aplicación"""
    __tablename__ = "app_role_configs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    app_definition_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("app_definitions.id", ondelete="CASCADE"), nullable=False
    )
    id_role: Mapped[str] = mapped_column(String(50), nullable=False)
    role_nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    app_definition: Mapped["AppDefinition"] = relationship(back_populates="roles")
    modules: Mapped[List["AppRoleModule"]] = relationship(
        back_populates="app_role_config", cascade="all, delete-orphan", lazy="selectin"
    )

    __table_args__ = (
        UniqueConstraint("app_definition_id", "id_role", name="uq_app_role"),
    )


class AppRoleModule(Base):
    """Módulos/endpoints accesibles por cada rol dentro de una aplicación"""
    __tablename__ = "app_role_modules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    app_role_config_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("app_role_configs.id", ondelete="CASCADE"), nullable=False
    )
    backend_service_id: Mapped[str] = mapped_column(String(50), nullable=False)
    endpoint_path: Mapped[str] = mapped_column(String(255), nullable=False)
    metodo: Mapped[str] = mapped_column(String(10), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    app_role_config: Mapped["AppRoleConfig"] = relationship(back_populates="modules")

    __table_args__ = (
        UniqueConstraint(
            "app_role_config_id", "backend_service_id", "endpoint_path", "metodo",
            name="uq_role_module_endpoint"
        ),
    )


class AppMenuConfig(Base):
    """Estructura del menú personalizado por aplicación"""
    __tablename__ = "app_menu_configs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    app_definition_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("app_definitions.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    menu_structure: Mapped[Dict] = mapped_column(JSON, default=list)

    app_definition: Mapped["AppDefinition"] = relationship(back_populates="menu_config")
