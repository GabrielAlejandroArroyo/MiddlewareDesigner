from sqlalchemy import String, Boolean, DateTime, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from config.database import Base

class UsuarioRolModel(Base):
    __tablename__ = "usuario_roles"

    internal_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String(50), nullable=False) # ID de mapeo (repetible)
    id_usuario: Mapped[str] = mapped_column(String(50), nullable=False)
    id_aplicacion: Mapped[str] = mapped_column(String(50), nullable=False)
    id_rol: Mapped[str] = mapped_column(String(50), nullable=False)
    
    baja_logica: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_alta_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_alta_modificacion: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint('id_usuario', 'id_aplicacion', 'id_rol', name='_user_app_rol_uc'),
    )
