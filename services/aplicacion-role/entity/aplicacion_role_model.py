from sqlalchemy import String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Optional
from config.database import Base

class AplicacionRoleModel(Base):
    __tablename__ = "aplicacion_roles"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    id_aplicacion: Mapped[str] = mapped_column(String(50), nullable=False)
    id_role: Mapped[str] = mapped_column(String(50), nullable=False)
    
    baja_logica: Mapped[bool] = mapped_column(Boolean, default=False)
    fecha_alta_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_alta_modificacion: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint('id_aplicacion', 'id_role', name='_app_role_uc'),
    )
